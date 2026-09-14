/*
 * EU AI Act risk checker: decision engine.
 *
 * Pure function, no DOM, no dependencies. The same file runs in the browser
 * (as a classic script, so index.html still works when opened from disk) and
 * in Node for the tests in test/engine.test.js.
 *
 * Legal basis:
 *   Regulation (EU) 2024/1689 (AI Act)
 *     https://eur-lex.europa.eu/eli/reg/2024/1689/oj
 *   Regulation (EU) 2026/1744 (Digital Omnibus on AI), amending the AI Act,
 *   in force since 27 July 2026
 *     https://eur-lex.europa.eu/eli/reg/2026/1744/oj
 *
 * The engine is a triage aid, not legal advice. Where the Act turns on a
 * judgement the tool cannot make (for example "significant harm" under
 * Article 5(1)(a) or the Article 6(3) risk assessment), the user answers that
 * question and the result says so.
 */
(function (root) {
  'use strict';

  // Application dates. Each one carries the provision it comes from.
  var DATES = {
    literacy: '2025-02-02',          // Art. 4, Art. 113(a)
    prohibitions: '2025-02-02',      // Art. 5(1)(a)-(h), Art. 113(a)
    newProhibitions: '2026-12-02',   // Art. 5(1)(ba) and (bb), inserted by Reg. (EU) 2026/1744
    gpai: '2025-08-02',              // Chapter V, Art. 113(b)
    gpaiLegacy: '2027-08-02',        // Art. 111(3): GPAI models placed on the market before 2 Aug 2025
    transparency: '2026-08-02',      // Art. 50, Art. 113
    markingLegacy: '2026-12-02',     // Art. 50(2) marking for systems placed on the market before 2 Aug 2026, Reg. (EU) 2026/1744
    highRiskAnnexIII: '2027-12-02',  // Art. 6(2) and Annex III, Art. 113 as amended by Reg. (EU) 2026/1744
    highRiskAnnexI: '2028-08-02',    // Art. 6(1) and Annex I, Art. 113 as amended by Reg. (EU) 2026/1744
  };

  var SOURCES = {
    aiAct: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj',
    omnibus: 'https://eur-lex.europa.eu/eli/reg/2026/1744/oj',
  };

  var ANNEX_III_AREAS = [
    'biometrics',             // Annex III point 1 (remote identification, categorisation, emotion recognition)
    'criticalInfrastructure', // point 2
    'education',              // point 3
    'employment',             // point 4
    'essentialServices',      // point 5
    'lawEnforcement',         // point 6
    'migration',              // point 7
    'justiceDemocracy',       // point 8
  ];

  var EXEMPTION_CONDITIONS = {
    narrowProcedural: 'Art. 6(3)(a)',
    improvesHumanActivity: 'Art. 6(3)(b)',
    detectsPatterns: 'Art. 6(3)(c)',
    preparatoryTask: 'Art. 6(3)(d)',
  };

  function evaluate(answers) {
    var a = answers || {};
    var role = a.role || 'deployer';
    var isProvider = role === 'provider' || role === 'both';
    var isDeployer = role === 'deployer' || role === 'both';

    var p = a.art5 || {};
    var prohibited = [];
    var notes = [];

    function ban(ref, key, from) { prohibited.push({ ref: ref, key: key, from: from || DATES.prohibitions }); }

    // (a) and (b) require that the practice causes, or is reasonably likely to
    // cause, significant harm.
    if (p.manipulative && p.manipulationSignificantHarm) ban('Art. 5(1)(a)', 'manipulative');
    else if (p.manipulative) notes.push({ ref: 'Art. 5(1)(a)', key: 'manipulativeNoHarm' });

    if (p.exploitsVulnerabilities && p.vulnerabilitySignificantHarm) ban('Art. 5(1)(b)', 'exploitsVulnerabilities');
    else if (p.exploitsVulnerabilities) notes.push({ ref: 'Art. 5(1)(b)', key: 'vulnerabilitiesNoHarm' });

    // (c) social scoring is banned only where the score leads to detrimental
    // treatment in an unrelated social context, or treatment that is
    // unjustified or disproportionate.
    if (p.socialScoring && (p.scoreUsedInUnrelatedContext || p.scoreTreatmentDisproportionate)) {
      ban('Art. 5(1)(c)', 'socialScoring');
    } else if (p.socialScoring) {
      notes.push({ ref: 'Art. 5(1)(c)', key: 'socialScoringConditionsNotMet' });
    }

    // (d) does not cover systems that support a human assessment already based
    // on objective, verifiable facts directly linked to criminal activity.
    if (p.crimePredictionByProfiling && !p.supportsFactBasedHumanAssessment) ban('Art. 5(1)(d)', 'crimePrediction');

    if (p.untargetedFacialScraping) ban('Art. 5(1)(e)', 'facialScraping');

    // (f) covers the workplace and education, except for medical or safety reasons.
    if (p.emotionRecognitionWorkOrEducation && !p.medicalOrSafetyReason) ban('Art. 5(1)(f)', 'emotionRecognition');
    else if (p.emotionRecognitionWorkOrEducation) notes.push({ ref: 'Art. 5(1)(f)', key: 'emotionMedicalSafetyException' });

    // (g) does not cover labelling or filtering of lawfully acquired biometric
    // datasets, or categorising biometric data in the area of law enforcement.
    if (p.sensitiveBiometricCategorisation && !p.lawfulDatasetLabelling) ban('Art. 5(1)(g)', 'biometricCategorisation');

    // (h) real-time remote biometric identification in publicly accessible
    // spaces for law enforcement: banned unless strictly necessary for one of
    // the three objectives and used under the Art. 5(2)-(3) safeguards
    // (prior authorisation, national law, FRIA, registration).
    var rbiPermitted = false;
    if (p.realTimeRbiLawEnforcement) {
      if (p.rbiObjective && p.rbiAuthorisedUnderNationalLaw) {
        rbiPermitted = true;
        notes.push({ ref: 'Art. 5(1)(h), 5(2)-(3)', key: 'rbiPermittedUnderSafeguards' });
      } else {
        ban('Art. 5(1)(h)', 'realTimeRbi');
      }
    }

    // New prohibitions inserted by Reg. (EU) 2026/1744, applicable from 2 Dec 2026.
    if (p.nonConsensualIntimateImagery) ban('Art. 5(1)(ba)', 'intimateImagery', DATES.newProhibitions);
    if (p.childSexualAbuseMaterial) ban('Art. 5(1)(bb)', 'csam', DATES.newProhibitions);

    // ── High risk ───────────────────────────────────────────────────────────
    var highRisk = [];
    var exemption = null;

    // Art. 6(1): safety component of, or itself, a product under Annex I law
    // that requires a third-party conformity assessment. Art. 6(3) does not
    // apply to this route.
    if (a.annexIProduct && a.annexIThirdPartyAssessment) {
      highRisk.push({ ref: 'Art. 6(1), Annex I', basis: 'annexI', from: DATES.highRiskAnnexI });
    } else if (a.annexIProduct) {
      notes.push({ ref: 'Art. 6(1)', key: 'annexINoThirdPartyAssessment' });
    }

    var areas = (a.annexIII || []).filter(function (x) { return ANNEX_III_AREAS.indexOf(x) !== -1; });
    if (rbiPermitted && areas.indexOf('biometrics') === -1) areas.push('biometrics');

    if (areas.length) {
      var e = a.art63 || {};
      var met = Object.keys(EXEMPTION_CONDITIONS).filter(function (k) { return e[k]; });
      // Art. 6(3): an Annex III system is not high-risk where it does not pose
      // a significant risk AND meets one of (a)-(d). A system that profiles
      // natural persons is always high-risk.
      var exempt = met.length > 0 && !e.profiling && !e.significantRisk && !rbiPermitted;
      if (exempt) {
        exemption = {
          ref: 'Art. 6(3)',
          conditions: met.map(function (k) { return EXEMPTION_CONDITIONS[k]; }),
          providerDuties: isProvider ? ['documentAssessment', 'registerArt49_2'] : [],
          deployerDuties: isDeployer ? ['obtainProviderAssessment'] : [],
        };
      } else {
        highRisk.push({
          ref: 'Art. 6(2), Annex III',
          basis: 'annexIII',
          areas: areas,
          from: DATES.highRiskAnnexIII,
          profilingOverride: met.length > 0 && !!e.profiling,
        });
      }
    }

    // ── Transparency, split by who carries the duty ─────────────────────────
    var t = a.art50 || {};
    var le = !!t.authorisedForLawEnforcement;
    var transparency = [];

    if (isProvider && t.interactsWithPeople && !t.obviousToUser && !le) {
      transparency.push({ ref: 'Art. 50(1)', holder: 'provider', duty: 'informOfInteraction', from: DATES.transparency });
    }
    if (isProvider && t.generatesSyntheticContent && !t.assistiveEditingOnly && !le) {
      transparency.push({
        ref: 'Art. 50(2)', holder: 'provider', duty: 'machineReadableMarking',
        from: t.placedOnMarketBeforeAug2026 ? DATES.markingLegacy : DATES.transparency,
      });
    }
    if (isDeployer && t.deploysEmotionOrBiometricCategorisation && !le) {
      transparency.push({ ref: 'Art. 50(3)', holder: 'deployer', duty: 'informExposedPersons', from: DATES.transparency });
    }
    if (isDeployer && t.publishesDeepfakes && !le) {
      transparency.push({
        ref: 'Art. 50(4)', holder: 'deployer', duty: 'discloseDeepfake', from: DATES.transparency,
        limitedForArtisticWork: !!t.artisticOrSatiricalWork,
      });
    }
    if (isDeployer && t.publishesPublicInterestText && !t.humanEditorialResponsibility && !le) {
      transparency.push({ ref: 'Art. 50(4)', holder: 'deployer', duty: 'discloseGeneratedText', from: DATES.transparency });
    }

    // ── GPAI models (Chapter V) ─────────────────────────────────────────────
    var gpai = null;
    if (a.gpaiProvider) {
      gpai = {
        ref: a.gpaiSystemicRisk ? 'Art. 53, Art. 55' : 'Art. 53',
        systemicRisk: !!a.gpaiSystemicRisk,
        from: a.gpaiPlacedBeforeAug2025 ? DATES.gpaiLegacy : DATES.gpai,
      };
    }

    var tier = prohibited.length ? 'prohibited'
      : highRisk.length ? 'high'
      : transparency.length ? 'limited'
      : 'minimal';

    return {
      tier: tier,
      role: role,
      prohibited: prohibited,
      highRisk: highRisk,
      exemption: exemption,
      transparency: transparency,
      gpai: gpai,
      literacy: { ref: 'Art. 4', from: DATES.literacy },
      notes: notes,
      sources: SOURCES,
    };
  }

  var api = { evaluate: evaluate, DATES: DATES, SOURCES: SOURCES, ANNEX_III_AREAS: ANNEX_III_AREAS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AIActEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
