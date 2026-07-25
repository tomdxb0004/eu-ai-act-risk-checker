# EU AI Act Risk Checker

A free, open-source, **single-file** tool that classifies an AI system into its
**EU AI Act risk tier** — prohibited, high, limited or minimal risk (plus GPAI
obligations) — and shows the resulting obligations and compliance deadline.

Based on **Regulation (EU) 2024/1689** (the EU AI Act). Runs entirely in the
browser: no backend, no tracking, no email gate, no dependencies.

> ⚠️ **Not legal advice.** This tool gives an indication only. Final
> classification depends on your specific system and context — always have a
> judgement verified by a qualified professional.

## Live demo

- **Hosted (bilingual EN/NL):** https://cruxdigits.nl/eu-ai-act-risk-checker/
- **This repo (single file):** open `index.html` in any browser, or host it on
  GitHub Pages.

## Why it exists

Most SMEs have no idea which EU AI Act tier their AI falls into — or that four
tiers even exist. This is a 4-question triage that gives a fast, honest answer
and points to the obligations that actually apply.

## Use it

```bash
git clone https://github.com/<you>/eu-ai-act-risk-checker.git
open eu-ai-act-risk-checker/index.html
```

Or embed it on your own site:

```html
<iframe src="https://<you>.github.io/eu-ai-act-risk-checker/"
        style="width:100%;height:900px;border:0" title="EU AI Act risk checker"></iframe>
```

## How the classification works

Four question steps, evaluated by **highest severity wins**:

1. **Prohibited practices** (Art. 5) → *Unacceptable risk* if any apply.
2. **High-risk uses** (Annex III + Annex I safety components) → *High risk*.
3. **Transparency triggers** (Art. 50: chatbots, generative/deepfake content,
   emotion recognition) → *Limited risk*.
4. **GPAI** (Art. 53–55): if you develop your own general-purpose model, GPAI
   obligations are added on top of whatever tier you land in.

If nothing applies → *Minimal risk* (most business AI). AI-literacy duties
(Art. 4) apply to everyone from 2 Feb 2025.

### Key dates

| Provision | Applies from |
|---|---|
| Regulation in force | 1 Aug 2024 |
| Prohibited practices | 2 Feb 2025 |
| GPAI + governance | 2 Aug 2025 |
| High-risk (Annex III) + transparency | 2 Aug 2026 |
| High-risk (Annex I, regulated products) | 2 Aug 2027 |

## Contributing

The Act evolves (guidance, delegated acts, code of practice updates). PRs that
keep the tiers, obligations and dates accurate are welcome — cite the source.

## License

MIT © Crux Digits B.V. — see [LICENSE](LICENSE).

Built and maintained by [Crux Digits](https://cruxdigits.nl/), a fixed-price AI
consultancy in the Netherlands.
