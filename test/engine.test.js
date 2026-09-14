// Decision-branch tests for engine.js. Run with: node --test
// Each test names the provision it checks.
const test = require('node:test');
const assert = require('node:assert/strict');
const { evaluate, DATES } = require('../engine.js');

const refs = (list) => list.map((x) => x.ref);

test('nothing selected is minimal risk, with the Art. 4 literacy duty', () => {
  const r = evaluate({});
  assert.equal(r.tier, 'minimal');
  assert.equal(r.literacy.ref, 'Art. 4');
});

test('Art. 5(1)(a): manipulation is banned only with significant harm', () => {
  assert.equal(evaluate({ art5: { manipulative: true } }).tier, 'minimal');
  assert.equal(evaluate({ art5: { manipulative: true, manipulationSignificantHarm: true } }).tier, 'prohibited');
  // harm answered for (b) does not carry over to (a)
  assert.equal(evaluate({ art5: { manipulative: true, vulnerabilitySignificantHarm: true } }).tier, 'minimal');
});

test('Art. 5(1)(b): exploiting vulnerabilities is banned only with significant harm', () => {
  assert.equal(evaluate({ art5: { exploitsVulnerabilities: true } }).tier, 'minimal');
  assert.equal(evaluate({ art5: { exploitsVulnerabilities: true, vulnerabilitySignificantHarm: true } }).tier, 'prohibited');
});

test('Art. 5(1)(c): social scoring needs an unrelated context or disproportionate treatment', () => {
  const plain = evaluate({ art5: { socialScoring: true } });
  assert.equal(plain.tier, 'minimal');
  assert.deepEqual(refs(plain.notes), ['Art. 5(1)(c)']);
  assert.equal(evaluate({ art5: { socialScoring: true, scoreUsedInUnrelatedContext: true } }).tier, 'prohibited');
  assert.equal(evaluate({ art5: { socialScoring: true, scoreTreatmentDisproportionate: true } }).tier, 'prohibited');
});

test('Art. 5(1)(d): fact-based human assessment support is not banned', () => {
  assert.equal(evaluate({ art5: { crimePredictionByProfiling: true } }).tier, 'prohibited');
  assert.equal(evaluate({ art5: { crimePredictionByProfiling: true, supportsFactBasedHumanAssessment: true } }).tier, 'minimal');
});

test('Art. 5(1)(f): emotion recognition at work or school, except medical or safety reasons', () => {
  assert.equal(evaluate({ art5: { emotionRecognitionWorkOrEducation: true } }).tier, 'prohibited');
  assert.equal(evaluate({ art5: { emotionRecognitionWorkOrEducation: true, medicalOrSafetyReason: true } }).tier, 'minimal');
});

test('Art. 5(1)(g): lawful dataset labelling is outside the ban', () => {
  assert.equal(evaluate({ art5: { sensitiveBiometricCategorisation: true } }).tier, 'prohibited');
  assert.equal(evaluate({ art5: { sensitiveBiometricCategorisation: true, lawfulDatasetLabelling: true } }).tier, 'minimal');
});

test('Art. 5(1)(h): real-time RBI is banned unless an objective AND authorisation apply; then it is high-risk', () => {
  assert.equal(evaluate({ art5: { realTimeRbiLawEnforcement: true } }).tier, 'prohibited');
  assert.equal(evaluate({ art5: { realTimeRbiLawEnforcement: true, rbiObjective: true } }).tier, 'prohibited');
  const ok = evaluate({ art5: { realTimeRbiLawEnforcement: true, rbiObjective: true, rbiAuthorisedUnderNationalLaw: true } });
  assert.equal(ok.tier, 'high');
  assert.deepEqual(ok.highRisk[0].areas, ['biometrics']);
});

test('Art. 5(1)(ba) and (bb): new prohibitions apply from 2 December 2026', () => {
  const r = evaluate({ art5: { nonConsensualIntimateImagery: true, childSexualAbuseMaterial: true } });
  assert.equal(r.tier, 'prohibited');
  assert.deepEqual(r.prohibited.map((x) => x.from), [DATES.newProhibitions, DATES.newProhibitions]);
  assert.equal(DATES.newProhibitions, '2026-12-02');
});

test('Annex III: high-risk from 2 December 2027 (Reg. (EU) 2026/1744)', () => {
  const r = evaluate({ annexIII: ['employment'] });
  assert.equal(r.tier, 'high');
  assert.equal(r.highRisk[0].from, '2027-12-02');
});

test('Art. 6(3): a narrow procedural task without profiling is not high-risk, with provider duties', () => {
  const r = evaluate({ role: 'provider', annexIII: ['education'], art63: { narrowProcedural: true } });
  assert.equal(r.tier, 'minimal');
  assert.equal(r.exemption.ref, 'Art. 6(3)');
  assert.deepEqual(r.exemption.conditions, ['Art. 6(3)(a)']);
  assert.deepEqual(r.exemption.providerDuties, ['documentAssessment', 'registerArt49_2']);
});

test('Art. 6(3): profiling of natural persons always stays high-risk', () => {
  const r = evaluate({ annexIII: ['employment'], art63: { preparatoryTask: true, profiling: true } });
  assert.equal(r.tier, 'high');
  assert.equal(r.exemption, null);
  assert.equal(r.highRisk[0].profilingOverride, true);
});

test('Art. 6(3): a significant risk to health, safety or rights removes the exemption', () => {
  const r = evaluate({ annexIII: ['essentialServices'], art63: { improvesHumanActivity: true, significantRisk: true } });
  assert.equal(r.tier, 'high');
});

test('Annex I: high-risk from 2 August 2028, only with third-party conformity assessment', () => {
  assert.equal(evaluate({ annexIProduct: true }).tier, 'minimal');
  const r = evaluate({ annexIProduct: true, annexIThirdPartyAssessment: true, art63: { narrowProcedural: true } });
  assert.equal(r.tier, 'high');
  assert.equal(r.highRisk[0].from, '2028-08-02');
  assert.equal(r.exemption, null, 'Art. 6(3) does not apply to the Annex I route');
});

test('Art. 50: a deployer is not given the provider duties', () => {
  const r = evaluate({ role: 'deployer', art50: { interactsWithPeople: true, generatesSyntheticContent: true } });
  assert.equal(r.tier, 'minimal');
  assert.deepEqual(r.transparency, []);
});

test('Art. 50(1) and 50(2): provider duties, with the obvious-to-user and assistive-editing exceptions', () => {
  const r = evaluate({ role: 'provider', art50: { interactsWithPeople: true, generatesSyntheticContent: true } });
  assert.deepEqual(refs(r.transparency), ['Art. 50(1)', 'Art. 50(2)']);
  assert.ok(r.transparency.every((x) => x.holder === 'provider'));
  const ex = evaluate({ role: 'provider', art50: { interactsWithPeople: true, obviousToUser: true, generatesSyntheticContent: true, assistiveEditingOnly: true } });
  assert.deepEqual(ex.transparency, []);
});

test('Art. 50(2): systems on the market before 2 August 2026 mark output by 2 December 2026', () => {
  const r = evaluate({ role: 'provider', art50: { generatesSyntheticContent: true, placedOnMarketBeforeAug2026: true } });
  assert.equal(r.transparency[0].from, '2026-12-02');
  assert.equal(evaluate({ role: 'provider', art50: { generatesSyntheticContent: true } }).transparency[0].from, '2026-08-02');
});

test('Art. 50(3) and 50(4): deployer duties for emotion recognition, deepfakes and public-interest text', () => {
  const r = evaluate({ role: 'deployer', art50: { deploysEmotionOrBiometricCategorisation: true, publishesDeepfakes: true, publishesPublicInterestText: true } });
  assert.deepEqual(r.transparency.map((x) => x.duty), ['informExposedPersons', 'discloseDeepfake', 'discloseGeneratedText']);
  assert.ok(r.transparency.every((x) => x.holder === 'deployer'));
});

test('Art. 50(4): text under human editorial responsibility needs no disclosure; artistic deepfakes get limited disclosure', () => {
  const r = evaluate({ role: 'deployer', art50: { publishesPublicInterestText: true, humanEditorialResponsibility: true, publishesDeepfakes: true, artisticOrSatiricalWork: true } });
  assert.deepEqual(r.transparency.map((x) => x.duty), ['discloseDeepfake']);
  assert.equal(r.transparency[0].limitedForArtisticWork, true);
});

test('Art. 50: law-enforcement authorisation removes the transparency duties', () => {
  const r = evaluate({ role: 'both', art50: { interactsWithPeople: true, publishesDeepfakes: true, authorisedForLawEnforcement: true } });
  assert.deepEqual(r.transparency, []);
});

test('GPAI: Art. 53 from 2 August 2025; legacy models by 2 August 2027 (Art. 111(3)); systemic risk adds Art. 55', () => {
  assert.equal(evaluate({ gpaiProvider: true }).gpai.from, '2025-08-02');
  const legacy = evaluate({ gpaiProvider: true, gpaiPlacedBeforeAug2025: true, gpaiSystemicRisk: true });
  assert.equal(legacy.gpai.from, '2027-08-02');
  assert.equal(legacy.gpai.ref, 'Art. 53, Art. 55');
});

test('highest severity wins: prohibited over high over limited', () => {
  const r = evaluate({ role: 'provider', art5: { untargetedFacialScraping: true }, annexIII: ['employment'], art50: { interactsWithPeople: true } });
  assert.equal(r.tier, 'prohibited');
  assert.equal(r.highRisk.length, 1);
  assert.equal(r.transparency.length, 1);
});
