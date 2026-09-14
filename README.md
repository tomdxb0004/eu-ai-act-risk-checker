# EU AI Act Risk Checker

A browser-based triage of an AI system under the EU AI Act: risk tier,
obligations, who carries them, and the date each one applies. Every result
cites the article it rests on.

Legal basis: **Regulation (EU) 2024/1689** (the AI Act) as amended by
**Regulation (EU) 2026/1744** (Digital Omnibus on AI, in force since
27 July 2026).

> **Not legal advice.** The tool gives an indication based on your answers.
> Several provisions turn on judgements it cannot make for you (significant
> harm, significant risk, whether use is obvious to a user). Have the final
> classification checked by a qualified professional.

## Use it

Open `index.html` in a browser. There is no build step, backend or tracking.

```bash
git clone https://github.com/tomdxb0004/eu-ai-act-risk-checker.git
open eu-ai-act-risk-checker/index.html
```

## How the classification works

The decision logic lives in [`engine.js`](engine.js), a pure function with no
DOM access. The page only collects answers and renders the result.

1. **Role** (Art. 3(3), 3(4)): provider, deployer or both. Transparency duties
   are filtered by role.
2. **Prohibited practices** (Art. 5), with their conditions and exceptions:
   - (a) and (b) only where significant harm is caused or reasonably likely;
   - (c) social scoring only where the score leads to detrimental treatment in
     an unrelated context, or treatment that is unjustified or disproportionate;
   - (d) not where the system supports a human assessment based on objective,
     verifiable facts;
   - (f) emotion recognition at work or in education, except for medical or
     safety reasons;
   - (g) not for labelling or filtering lawfully acquired biometric datasets;
   - (h) real-time remote biometric identification for law enforcement unless
     strictly necessary for one of the three objectives **and** authorised
     under Art. 5(2)-(3); permitted use is then treated as high-risk;
   - (ba) non-consensual intimate imagery and (bb) child sexual abuse material,
     added by Reg. (EU) 2026/1744 and applicable from 2 December 2026.
3. **High risk**:
   - Art. 6(1) and Annex I: products or safety components that require a
     third-party conformity assessment. Art. 6(3) does not apply to this route.
   - Art. 6(2) and Annex III: the eight listed areas, followed by the
     **Art. 6(3)** check. The system is not high-risk if it meets one of
     conditions (a)-(d) and poses no significant risk, **unless it profiles
     natural persons**. A provider relying on the exception must document the
     assessment (Art. 6(4)) and register (Art. 49(2)).
4. **Transparency** (Art. 50), by duty holder:
   - providers: inform people they are interacting with AI (50(1)), unless
     obvious; machine-readable marking of synthetic output (50(2)), unless
     assistive editing only;
   - deployers: inform people exposed to emotion recognition or biometric
     categorisation (50(3)); disclose deepfakes, with limited disclosure for
     evidently artistic or satirical work, and AI-generated text published on
     matters of public interest unless under human editorial responsibility
     (50(4));
   - the law-enforcement authorisation exception applies throughout.
5. **General-purpose AI models** (Chapter V): Art. 53, plus Art. 55 for
   systemic risk.

The tier shown is the most severe one reached: prohibited, then high risk,
then transparency duties, then minimal. AI literacy measures (Art. 4) apply in
every case.

## Application dates

| Provision | Applies from | Source |
|---|---|---|
| Entry into force | 1 Aug 2024 | Reg. 2024/1689, Art. 113 |
| AI literacy (Art. 4), prohibited practices (Art. 5(1)(a)-(h)) | 2 Feb 2025 | Art. 113(a) |
| GPAI model obligations (Chapter V) | 2 Aug 2025 | Art. 113(b) |
| GPAI models placed on the market before 2 Aug 2025 | 2 Aug 2027 | Art. 111(3) |
| Transparency (Art. 50) | 2 Aug 2026 | Art. 113 |
| Art. 50(2) marking, systems on the market before 2 Aug 2026 | 2 Dec 2026 | Reg. 2026/1744 |
| New prohibitions Art. 5(1)(ba), (bb) | 2 Dec 2026 | Reg. 2026/1744 |
| High-risk, Annex III (Art. 6(2)) | 2 Dec 2027 | Art. 113 as amended by Reg. 2026/1744 |
| High-risk, Annex I (Art. 6(1)) | 2 Aug 2028 | Art. 113 as amended by Reg. 2026/1744 |

## Tests

Every decision branch above has a test in [`test/engine.test.js`](test/engine.test.js),
named after the provision it checks. Requires Node 18 or later, no packages.

```bash
node --test
```

The tests run on every push through GitHub Actions.

## Sources

- Regulation (EU) 2024/1689 (AI Act): https://eur-lex.europa.eu/eli/reg/2024/1689/oj
- Regulation (EU) 2026/1744 (Digital Omnibus on AI): https://eur-lex.europa.eu/eli/reg/2026/1744/oj

## Limitations

- It does not assess the Art. 3(1) definition of an AI system, territorial
  scope (Art. 2) or the exclusions for military, research and personal use.
- Annex III areas are summarised; check the full annex text for your use case.
- Guidance, delegated acts and codes of practice can change how a provision is
  read. The tool reflects the regulation text only.

## Changelog

- **14 Sep 2026**: legal logic rewritten. High-risk dates updated to
  Reg. (EU) 2026/1744; Art. 6(3) exception added; Art. 50 split into provider
  and deployer duties; Art. 5 conditions and exceptions added, including the
  two new prohibitions; decision engine separated and covered by tests.
- **25 Jul 2026**: first version.

## Contributing

Corrections are welcome. Please cite the article, and add or update the test
for the branch you change.

## License

MIT © Crux Digits B.V. See [LICENSE](LICENSE).
