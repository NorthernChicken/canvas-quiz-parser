#!/usr/bin/env python3
"""
parse_canvas_quiz.py

Parse a Canvas quiz export HTML (`input.htm`) and write a human-readable
`output.txt` listing each question, its answer choices, and which answers
are marked correct in the HTML.

Usage: python parse_canvas_quiz.py input.htm

Writes `output.txt` next to the input file.

Made by NorthernChicken
Repo: https://github.com/NorthernChicken/canvas-quiz-parser
"""
import sys
from pathlib import Path
from bs4 import BeautifulSoup


def extract_questions(soup):
    questions = []
    for qdiv in soup.select('div.display_question.question'):
        name = qdiv.select_one('.name.question_name')
        qname = name.get_text(strip=True) if name else 'Question'

        qtext_div = qdiv.select_one('.question_text')
        qtext = ''
        if qtext_div:
            for bad in qtext_div.select('select, option, input'):
                bad.decompose()
            qtext = ' '.join(qtext_div.stripped_strings)

        answers = []

        groups = qdiv.select('.answer_group')
        if groups:
            for group in groups:
                heading = group.select_one('.answer-group-heading')
                label = heading.get_text(strip=True).rstrip(':') if heading else ''

                chosen_text = None
                chosen_correct = False
                for aitem in group.select('.answer'):
                    at = aitem.select_one('.answer_text')
                    if at:
                        txt = at.get_text(strip=True)
                    else:
                        txt = ' '.join(aitem.stripped_strings).replace('Correct', '').strip()

                    qc = aitem.select_one('.quiz_comment')
                    is_correct = bool(qc and 'correct' in qc.get_text(strip=True).lower())

                    if is_correct:
                        chosen_text = txt
                        chosen_correct = True
                        break

                    classes = aitem.get('class') or []
                    if 'selected_answer' in classes and chosen_text is None:
                        chosen_text = txt

                if chosen_text is None:
                    first = group.select_one('.answer .answer_text')
                    chosen_text = first.get_text(strip=True) if first else ''

                answers.append({'label': label, 'text': chosen_text, 'correct': chosen_correct})
        else:
            mcq_items = []
            for a in qdiv.select('.answers .answer'):
                at = a.select_one('.answer_text')
                if at:
                    ans_text = at.get_text(strip=True)
                else:
                    ans_text = ' '.join(a.stripped_strings).replace('Correct', '').strip()
                qc = a.select_one('.quiz_comment') or a.select_one('.hide_right_arrow .quiz_comment')
                has_qc = bool(qc and 'correct' in qc.get_text(strip=True).lower())
                is_selected = 'selected_answer' in (a.get('class') or [])
                inp = a.select_one('input[type="radio"][checked], input[type="checkbox"][checked]')
                if inp:
                    is_selected = True
                mcq_items.append({'text': ans_text, 'has_qc': has_qc, 'selected': is_selected})

            any_qc = any(x['has_qc'] for x in mcq_items)
            for it in mcq_items:
                correct = it['has_qc'] if any_qc else it['selected']
                answers.append({'label': '', 'text': it['text'], 'correct': correct})

            for sel in qdiv.select('select.question_input'):
                selected = sel.find('option', selected=True)
                if selected and selected.get_text(strip=True) != '[ Select ]':
                    text = selected.get_text(strip=True)
                    answers.append({'label': '', 'text': text, 'correct': False})

            for inp in qdiv.select('input.question_input[type="text"]'):
                val = inp.get('value', '').strip()
                if val:
                    lbl = inp.get('name', '')
                    answers.append({'label': lbl, 'text': val, 'correct': False})

        seen = {}
        clean_answers = []
        for a in answers:
            label = a.get('label', '')
            text = a.get('text', '').strip()
            if not text and not label:
                continue
            key = f"{label}||{text}"
            if key in seen:
                if a.get('correct'):
                    clean_answers[seen[key]]['correct'] = True
                continue
            seen[key] = len(clean_answers)
            clean_answers.append({'label': label, 'text': text, 'correct': bool(a.get('correct'))})

        questions.append({'name': qname, 'text': qtext, 'answers': clean_answers})

    return questions


def format_output(questions):
    merged = {}
    order = []
    for q in questions:
        key = q['name']
        if key in merged:
            existing = merged[key]
            for a in q['answers']:
                text = a['text']
                found = next((x for x in existing['answers'] if x['text'] == text), None)
                if found:
                    found['correct'] = found['correct'] or a.get('correct', False)
                else:
                    existing['answers'].append(a)
        else:
            merged[key] = {'text': q.get('text',''), 'answers': list(q.get('answers',[]))}
            order.append(key)

    lines = []
    for idx, name in enumerate(order, start=1):
        q = merged[name]
        lines.append(f"Question {idx}: {name}")
        if q['text']:
            lines.append(f"  {q['text']}")
        if not q['answers']:
            lines.append('  (No answers found)')
        else:
            for j, a in enumerate(q['answers'], start=1):
                mark = '  [Correct]' if a.get('correct') else ''
                label = a.get('label')
                if label:
                    lines.append(f"  {label}: {a['text']}{mark}")
                else:
                    lines.append(f"  Answer {j}: {a['text']}{mark}")
        lines.append('')
    return '\n'.join(lines)


def main():
    if len(sys.argv) < 2:
        print('Usage: python parse_canvas_quiz.py input.htm')
        sys.exit(1)
    inpath = Path(sys.argv[1])
    if not inpath.exists():
        print('File not found:', inpath)
        sys.exit(1)

    html = inpath.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    questions = extract_questions(soup)

    out = format_output(questions)
    outpath = inpath.parent / 'output.txt'
    outpath.write_text(out, encoding='utf-8')
    print('Wrote', outpath)


if __name__ == '__main__':
    main()
