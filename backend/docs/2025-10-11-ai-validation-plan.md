# 2025-10-11 AI Validation Plan

## Diary Question Generation Scenarios
| id | mode | dataset prerequisites | execution steps | expected outcome |
| --- | --- | --- | --- | --- |
| QG-01 | baseline | user has no journals, no check-ins | call `POST /question/generate` with empty history; log selected model | response contains 5 items covering emotion, relationship, recovery, action, goal with fallback flag `false`; content references profile interests only |
| QG-02 | past-aware structured | at least 3 journals saved via `selectedQuestionTexts`; check-ins available | seed journals, invoke `POST /question/generate`; inspect prompt payload via debug log | questions reuse recent themes, avoid duplicated stems from last 3 days, include at least one recovery prompt if sleep_score < 0.35 |
| QG-03 | mixed freeform + high stress | mix of freeform content mentioning "team lead" and check-in stress >= 8 for two days | request question generation with `preferredModel=gpt-5` to trigger fallback ordering | first question acknowledges heavy mood, one relationship question references work context, recovery question suggests stress relief; log shows model fallback sequence |
| QG-04 | regeneration fatigue | set `regenerationCount` >= 3 and `noResponseRate` >= 0.6 in seed data | trigger generate and capture JSON | at least one question altered to shorter 40-60 chars, domains still cover >=4 categories, `confidence` reduced (<0.7) |
| QG-05 | API outage fallback | temporarily revoke external keys or mock failure in generator | call generate endpoint | service returns factory fallback set with `fallback=true`, log emits "모든 AI 모델 실패" |

## Question-Based Diary Summary Scenarios
| id | trigger | setup | verification |
| --- | --- | --- | --- |
| DS-01 | `saveQuestionAnswers` | submit 5 QA pairs (~1500 chars) | inspect returned summary length (<1200 chars), `summary.modelUsed` equals request model or fallback |
| DS-02 | `createDiary` with `finalize=true` | call diary create API with large body ( >3000 chars ) | confirm summary truncation flag toggled, persisted `journal.summaryTruncated=true` |
| DS-03 | cache hit | repeat summary request with identical payload | second call returns `cached:true`, logs skip external call |
| DS-04 | rate limit | call `summarize` more than 5 times per minute per user | response uses raw content, `fallbackUsed=true`, `rateLimited=true` |
| DS-05 | generator failure | mock generator throw | summary service returns raw text and logs error |

## Mental Advice Current Logic (AdviceService)
- Collects last diary summary, recent 3 and 14 day check-ins, baseline values.
- Derives score deltas: sleepLow, stressHigh, energyLow, repeatedNegative.
- Computes z-score based risk (mild, moderate, severe) and persists advice with tags.
- Severe risk triggers in-app notification via `NotificationService`.
- Uses static copy lines; no LLM usage today.

## Roadmap: Random Metric Highlight + Fixed Prompt LLM Calls
1. Extract signal summary builder returning array of metric facts (eg, `sleep_hours_change`, `stress_z`).
2. Pick one metric randomly but weight by severity; expose deterministic seed for testing.
3. Define shared prompt template (Gemini primary, Claude and GPT fallback) referencing:
   - user snippet summary
   - selected metric fact with value and baseline delta
   - desired tone (friend-like, <= 120 chars)
4. Implement provider adapter similar to `QuestionGeneratorFactory` with retry + caching.
5. Store generated copy plus metadata (`modelUsed`, `metricKey`) to `advice` table.
6. Add feature flag `MENTAL_ADVICE_LLM_ENABLED` and CLI toggle for rollout.

### Prompt Skeleton
```
System: You craft a 120 character Korean encouragement based on one wellbeing metric. Do not mention raw numbers.
User: {
  "metric": "sleep_hours", "trend": "down", "baselineDiff": -1.5,
  "summary": "지난 이틀 동안 야근으로 늦게 잤고 아침 피로를 느꼈다.",
  "tone": "soft friend", "risk": "moderate"
}
Expected: 단문 1개, warm suggestion, includes concrete next step.
```

## Mental Trend Sample Data Usage
- File: `frontend/src/mock/mental-trend-sample.ts` supplies deterministic 7 day dataset (values 42-78) for UI smoke tests.
- `profile/page.tsx` preloads this sample when toggling the graph and replaces it only if API returns data.
- During API errors it keeps the sample visible and surfaces a debug banner.
- Manual QA: toggle graph without backend, confirm sparkline renders, tooltips fall back gracefully.
