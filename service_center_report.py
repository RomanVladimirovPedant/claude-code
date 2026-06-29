#!/usr/bin/env python3
"""Сервис формирования отчёта о работе сервисного центра.

Источник данных — JSON-файлы с результатами анализа аудио/видео записей
обслуживания клиентов (структура: sc_id, begin, end, results[[...]]).
Файлы могут лежать как напрямую в каталоге, так и в подкаталогах по
идентификатору сервисного центра (например, `052/052_..._....json`).

Отчёт строится по требованиям:
  - время посещений клиентов;
  - диалоги, разбитые по клиентам;
  - оценка качества обслуживания;
  - критичные моменты в обслуживании (red flags);
  - количество посещений сервиса.

Использование:
    python3 service_center_report.py <каталог_с_данными> -o report.html
"""
from __future__ import annotations

import argparse
import glob
import html
import json
import os
import re
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional

QC_LABELS = {
    "greeted": "Поприветствовал",
    "asked_name": "Спросил имя",
    "no_rudeness": "Без грубости",
    "said_goodbye": "Попрощался",
    "next_step": "Обозначил следующий шаг",
    "offered_diagnostics": "Предложил диагностику",
    "stated_price": "Назвал цену",
    "explained_price": "Объяснил цену",
    "stated_timeline": "Назвал сроки",
    "stated_warranty": "Сообщил о гарантии",
    "collected_contacts": "Собрал контакты",
    "upsell_attempted": "Предложил доп. услугу",
    "asked_review": "Попросил отзыв",
}


@dataclass
class Visit:
    sc_id: str
    begin: datetime
    end: datetime
    kind: str
    client_name: Optional[str]
    client_phone: Optional[str]
    client_goal: Optional[str]
    summary: str
    content: str
    quality: dict
    red_flags: list = field(default_factory=list)
    green_flags: list = field(default_factory=list)

    @property
    def quality_score(self) -> Optional[float]:
        checked = [v.get("passed") for v in self.quality.values() if v.get("passed") is not None]
        if not checked:
            return None
        return sum(1 for v in checked if v) / len(checked)


def _parse_dt(s: str) -> datetime:
    return datetime.fromisoformat(s.replace("Z", "+00:00"))


def load_visits(data_dir: str) -> list[Visit]:
    visits: list[Visit] = []
    files = sorted(glob.glob(os.path.join(data_dir, "**", "*.json"), recursive=True))
    for path in files:
        try:
            data = json.load(open(path, encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        if "results" not in data or "sc_id" not in data:
            continue
        sc_id = data["sc_id"]
        begin = _parse_dt(data["begin"])
        end = _parse_dt(data["end"])
        for group in data.get("results", []):
            for item in group or []:
                if not item or item.get("type") not in ("dialogue", "monologue"):
                    continue
                deals = item.get("deals") or {}
                flags = item.get("flags") or {}
                visits.append(Visit(
                    sc_id=sc_id,
                    begin=begin,
                    end=end,
                    kind=item["type"],
                    client_name=(deals.get("client_name") or "").strip() or None,
                    client_phone=deals.get("client_phone"),
                    client_goal=deals.get("client_goal"),
                    summary=deals.get("summary") or "",
                    content=item.get("content") or "",
                    quality=item.get("quality_control") or {},
                    red_flags=flags.get("red_flags") or [],
                    green_flags=flags.get("green_flags") or [],
                ))
    visits.sort(key=lambda v: (v.sc_id, v.begin))
    return visits


def _normalize_phone(phone: str) -> Optional[str]:
    digits = re.sub(r"\D", "", phone)
    return digits[-10:] if len(digits) >= 7 else None


def client_key(v: Visit) -> Optional[str]:
    if v.client_phone:
        norm = _normalize_phone(v.client_phone)
        if norm:
            return f"phone:{norm}"
    if v.client_name:
        return f"name:{v.client_name.lower()}"
    return None


def group_by_client(visits: list[Visit]) -> "dict[str, list[Visit]]":
    """Группирует визиты одного сервисного центра по клиенту.

    Визиты без имени/телефона считаются отдельными анонимными клиентами,
    поскольку нет иного способа их связать друг с другом.
    """
    groups: dict[str, list[Visit]] = defaultdict(list)
    anon_counter = 0
    for v in visits:
        key = client_key(v)
        if key is None:
            anon_counter += 1
            key = f"anon:{anon_counter}"
        groups[key].append(v)
    return groups


def client_label(key: str, visits: list[Visit]) -> str:
    for v in visits:
        if v.client_name:
            return v.client_name
    if key.startswith("phone:"):
        return key.split(":", 1)[1]
    return "Анонимный клиент"


def esc(s) -> str:
    return html.escape(str(s)) if s is not None else ""


def fmt_time(dt: datetime) -> str:
    return dt.strftime("%H:%M")


def fmt_date(dt: datetime) -> str:
    return dt.strftime("%d.%m.%Y")


def render_quality_badge(score: Optional[float]) -> str:
    if score is None:
        return '<span class="badge badge-neutral">нет данных</span>'
    pct = round(score * 100)
    cls = "badge-good" if pct >= 70 else "badge-warn" if pct >= 40 else "badge-bad"
    return f'<span class="badge {cls}">{pct}%</span>'


def render_flags(flags: list, kind: str) -> str:
    if not flags:
        return ""
    cls = "red" if kind == "red" else "green"
    items = "".join(
        f'<li><b>{esc(f.get("quote") or "")}</b><br>{esc(f.get("description") or "")}</li>'
        for f in flags
    )
    label = "Критичные моменты" if kind == "red" else "Положительные моменты"
    return f'<div class="flags {cls}"><div class="flags-title">{label} ({len(flags)})</div><ul>{items}</ul></div>'


def render_quality_table(quality: dict) -> str:
    rows = []
    for key, label in QC_LABELS.items():
        v = quality.get(key) or {}
        passed = v.get("passed")
        mark = "✅" if passed is True else "❌" if passed is False else "—"
        rows.append(f"<tr><td>{esc(label)}</td><td class='qc-mark'>{mark}</td></tr>")
    return f"<table class='qc-table'>{''.join(rows)}</table>"


def render_visit(v: Visit) -> str:
    score = v.quality_score
    return f"""
    <div class="visit-card">
      <div class="visit-head">
        <span class="visit-time">{fmt_time(v.begin)}–{fmt_time(v.end)}</span>
        <span class="visit-goal">{esc(v.client_goal or '—')}</span>
        {render_quality_badge(score)}
      </div>
      <div class="visit-summary">{esc(v.summary)}</div>
      {render_flags(v.red_flags, 'red')}
      {render_flags(v.green_flags, 'green')}
      <details class="visit-details">
        <summary>Диалог и контроль качества</summary>
        <div class="visit-detail-body">
          <pre class="dialogue-content">{esc(v.content)}</pre>
          {render_quality_table(v.quality)}
        </div>
      </details>
    </div>"""


def render_sc_section(sc_id: str, visits: list[Visit]) -> str:
    groups = group_by_client(visits)
    scored = [v.quality_score for v in visits if v.quality_score is not None]
    avg_score = sum(scored) / len(scored) if scored else None
    total_red = sum(len(v.red_flags) for v in visits)
    total_green = sum(len(v.green_flags) for v in visits)
    dates = sorted({fmt_date(v.begin) for v in visits})

    clients_html = ""
    for key, group_visits in sorted(groups.items(), key=lambda kv: kv[1][0].begin):
        label = client_label(key, group_visits)
        clients_html += f"""
        <div class="client-block">
          <div class="client-head">
            <span class="client-name">{esc(label)}</span>
            <span class="badge badge-neutral">{len(group_visits)} {('визит' if len(group_visits) == 1 else 'визита')}</span>
          </div>
          {''.join(render_visit(v) for v in group_visits)}
        </div>"""

    critical_html = ""
    criticals = [(v, f) for v in visits for f in v.red_flags]
    if criticals:
        items = "".join(
            f'<li><span class="crit-time">{fmt_time(v.begin)}</span> '
            f'<b>{esc(f.get("quote") or "")}</b><br>{esc(f.get("description") or "")}</li>'
            for v, f in criticals
        )
        critical_html = f'<div class="critical-section"><h3>Критичные моменты ({len(criticals)})</h3><ul>{items}</ul></div>'

    return f"""
    <section class="sc-section">
      <h2>Сервисный центр {esc(sc_id)}</h2>
      <div class="stats-row">
        <div class="stat-card"><div class="stat-value">{len(visits)}</div><div class="stat-label">Посещений</div></div>
        <div class="stat-card"><div class="stat-value">{len(groups)}</div><div class="stat-label">Клиентов</div></div>
        <div class="stat-card"><div class="stat-value">{render_quality_badge(avg_score)}</div><div class="stat-label">Качество обслуживания</div></div>
        <div class="stat-card"><div class="stat-value">{total_red}</div><div class="stat-label">Критичных моментов</div></div>
        <div class="stat-card"><div class="stat-value">{total_green}</div><div class="stat-label">Положительных моментов</div></div>
        <div class="stat-card"><div class="stat-value">{len(dates)}</div><div class="stat-label">Дней в отчёте</div></div>
      </div>
      {critical_html}
      <h3>Посещения по клиентам</h3>
      {clients_html}
    </section>"""


STYLE = """
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,'Segoe UI',sans-serif;background:#0e0e10;color:#f4f4f5;line-height:1.5;padding:24px;}
  h1{font-size:22px;margin-bottom:4px;}
  .subtitle{color:#a1a1aa;margin-bottom:24px;}
  h2{font-size:18px;margin:32px 0 12px;border-bottom:1px solid #3f3f46;padding-bottom:8px;}
  h3{font-size:15px;margin:20px 0 10px;color:#d4d4d8;}
  .stats-row{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;}
  .stat-card{background:#18181b;border:1px solid #27272a;border-radius:10px;padding:12px 16px;min-width:120px;}
  .stat-value{font-size:20px;font-weight:600;}
  .stat-label{font-size:12px;color:#a1a1aa;margin-top:2px;}
  .badge{display:inline-block;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;}
  .badge-neutral{background:#27272a;color:#d4d4d8;}
  .badge-good{background:rgba(34,197,94,.15);color:#4ade80;}
  .badge-warn{background:rgba(245,158,11,.15);color:#fbbf24;}
  .badge-bad{background:rgba(239,68,68,.15);color:#f87171;}
  .client-block{background:#18181b;border:1px solid #27272a;border-radius:10px;padding:14px;margin-bottom:14px;}
  .client-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;}
  .client-name{font-weight:600;font-size:14px;}
  .visit-card{background:#101012;border:1px solid #27272a;border-radius:8px;padding:10px 12px;margin-bottom:8px;}
  .visit-head{display:flex;gap:10px;align-items:center;margin-bottom:6px;flex-wrap:wrap;}
  .visit-time{font-weight:600;color:#e4e4e7;}
  .visit-goal{color:#a1a1aa;font-size:12px;text-transform:uppercase;}
  .visit-summary{color:#d4d4d8;font-size:13px;margin-bottom:6px;}
  .flags{border-radius:6px;padding:8px 10px;margin:6px 0;font-size:12px;}
  .flags.red{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);}
  .flags.green{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.25);}
  .flags-title{font-weight:600;margin-bottom:4px;}
  .flags ul{padding-left:18px;}
  .critical-section{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.25);border-radius:10px;padding:14px;margin-bottom:20px;}
  .critical-section ul{padding-left:18px;}
  .crit-time{color:#a1a1aa;font-size:12px;margin-right:6px;}
  .visit-details{margin-top:6px;}
  .visit-details summary{cursor:pointer;color:#71717a;font-size:12px;}
  .dialogue-content{white-space:pre-wrap;font-size:12px;color:#d4d4d8;background:#0a0a0b;padding:8px;border-radius:6px;margin:8px 0;max-height:300px;overflow:auto;}
  .qc-table{width:100%;font-size:12px;border-collapse:collapse;}
  .qc-table td{padding:3px 6px;border-bottom:1px solid #27272a;}
  .qc-mark{text-align:right;}
</style>"""


def build_report(visits: list[Visit]) -> str:
    by_sc: "dict[str, list[Visit]]" = defaultdict(list)
    for v in visits:
        by_sc[v.sc_id].append(v)

    total_visits = len(visits)
    total_clients = sum(len(group_by_client(by_sc[sc])) for sc in by_sc)
    sections = "".join(render_sc_section(sc, by_sc[sc]) for sc in sorted(by_sc))

    return f"""<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<title>Отчёт о работе сервисного центра</title>
{STYLE}
</head><body>
<h1>Отчёт о работе сервисного центра</h1>
<div class="subtitle">Сервисных центров: {len(by_sc)} · Посещений: {total_visits} · Клиентов: {total_clients}</div>
{sections}
</body></html>"""


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("data_dir", help="Каталог с JSON-файлами анализа записей")
    parser.add_argument("-o", "--output", default="report.html", help="Путь к итоговому HTML-файлу")
    args = parser.parse_args()

    visits = load_visits(args.data_dir)
    if not visits:
        raise SystemExit(f"В каталоге {args.data_dir} не найдено подходящих данных")

    report_html = build_report(visits)
    with open(args.output, "w", encoding="utf-8") as f:
        f.write(report_html)
    print(f"Отчёт сохранён: {args.output} ({len(visits)} визитов)")


if __name__ == "__main__":
    main()
