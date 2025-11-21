import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import {
  QuestionGeneratorInterface,
  QuestionGenerationRequest,
  QuestionGenerationResponse,
  AIModel,
  GeneratedQuestionItem,
} from '../interfaces/question-generator.interface';
import { tryParseQuestionJson } from '../validators/question-schema';


export class GPTQuestionGenerator extends QuestionGeneratorInterface {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(GPTQuestionGenerator.name);

  constructor() {
    super(AIModel.GPT_5);

    // API 키 검증
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateQuestion(
    request: QuestionGenerationRequest,
  ): Promise<QuestionGenerationResponse> {
    try {
      const systemPrompt = this.createSystemPrompt();
      const userPrompt = this.createUserPrompt(request);

      const raw = await this.callAPI(userPrompt, systemPrompt);
      const parsed = this.parseQuestions(raw);
      if (!parsed.questions.length) throw new Error('파싱 실패');
      return {
        questions: parsed.questions,
        confidence: 0.92,
        modelUsed: this.modelName,
        fallbackUsed: false,
        rawOutput: raw,
      };
    } catch (error) {
      this.logger.error('GPT-5 질문 생성 오류:', error);
      return this.getDefaultQuestionSet(request.metaInfo.dayOfWeek);
    }
  }

  private parseQuestions(raw: string): { questions: GeneratedQuestionItem[] } {
    const questions: GeneratedQuestionItem[] = [];
    const sanitize = (t: string) => t.replace(/```+json?/gi, '```');
    const work = sanitize(raw);

    const extractJson = (): string | undefined => {
      const fence = work.match(/```+\s*(?:json)?\s*([\s\S]*?)```/i);
      if (fence) return fence[1];
      const braceStart = work.indexOf('{');
      const braceEnd = work.lastIndexOf('}');
      if (braceStart !== -1 && braceEnd > braceStart) {
        return work.slice(braceStart, braceEnd + 1);
      }
    };

    const tryParse = (candidate?: string) => {
      if (!candidate) return false;
      try {
        const valid = tryParseQuestionJson(candidate);
        if (valid) {
          for (const q of valid.questions) {
            const text = this.postProcessQuestion(
              String(q.text)
                .trim()
                .replace(/^['"`]+|['"`]+$/g, ''),
            );
            if (this.autoQualityFilter(text))
              questions.push({ domain: q.domain, text });
          }
          return questions.length > 0;
        }
        return false;
      } catch {
        return false;
      }
    };

    const parsed = tryParse(extractJson()) || tryParse(work);

    if (!parsed) {
      // 라인 기반 폴백 (코드펜스/JSON 키/중괄호 제거)
      const lines = work
        .split(/\n+/)
        .map((l) => l.trim())
        .filter(
          (l) =>
            l.length >= 4 &&
            l.length <= 120 &&
            !/^```/.test(l) &&
            !/^[{}\[\]]+$/.test(l) &&
            !/^"?questions"?\s*:/.test(l),
        )
        .slice(0, 5);
      const domains: GeneratedQuestionItem['domain'][] = [
        'emotion',
        'action',
        'relationship',
        'recovery',
        'goal',
      ];
      for (let i = 0; i < lines.length; i++) {
        const txt = this.postProcessQuestion(lines[i]);
        if (this.autoQualityFilter(txt)) {
          questions.push({ domain: domains[i] || 'emotion', text: txt });
        }
      }
    }

    return { questions: questions.slice(0, 5) };
  }

  protected async callAPI(
    userPrompt: string,
    systemPrompt?: string,
  ): Promise<string> {
    try {
      // API 키 재검증
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API 키가 설정되지 않았습니다');
      }

      // GPT-5 새로운 responses API 시도
      return await this.callGPT5ResponsesAPI(userPrompt, systemPrompt);
    } catch (error) {
      this.logger.log(
        'GPT-5 responses API 실패, chat completions API로 폴백:',
        error.message,
      );

      try {
        // 폴백: 기존 chat completions API 사용
        return await this.callChatCompletionsAPI(userPrompt, systemPrompt);
      } catch (fallbackError) {
        this.logger.error('모든 GPT API 호출 실패:', fallbackError);

        // API 제한 체크
        if (fallbackError.status === 429) {
          throw new Error(
            'OpenAI API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.',
          );
        }

        throw new Error(
          `GPT API 요청 실패: ${fallbackError.message || fallbackError}`,
        );
      }
    }
  }

  private async callGPT5ResponsesAPI(
    userPrompt: string,
    systemPrompt?: string,
  ): Promise<string> {
    const input: any[] = [];

    // developer role은 시스템 프롬프트 역할
    if (systemPrompt) {
      input.push({
        role: 'developer',
        content: [
          {
            type: 'input_text',
            text: systemPrompt,
          },
        ],
      });
    }

    // user role로 사용자 프롬프트 추가
    input.push({
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: userPrompt,
        },
      ],
    });

    const response = await this.openai.responses.create({
      model: 'gpt-5',
      input,
      text: {
        format: {
          type: 'text',
        },
        verbosity: 'medium',
      },
      reasoning: {
        effort: 'medium',
        summary: 'auto',
      },
      tools: [],
      store: false, // 개인정보 보호를 위해 저장하지 않음
    } as any);

    // 핵심 메타 로그만 (과도한 전체 JSON 방지)
    try {
      const metaLog = {
        id: (response as any)?.id,
        model: (response as any)?.model,
        outputCount: Array.isArray((response as any)?.output)
          ? (response as any).output.length
          : undefined,
        usage: (response as any)?.usage,
        hasOutputText: !!(response as any)?.output_text,
      };
      this.logger.log('[GPT-5][responses] meta:', JSON.stringify(metaLog));
    } catch {}

    // 실제 응답 구조 기반 파싱
    const anyResp: any = response;

    // 1. output_text 최우선
    if (typeof anyResp.output_text === 'string' && anyResp.output_text.trim()) {
      return anyResp.output_text.trim();
    }

    // 2. output 배열에서 type === 'message' → content[] 안의 type === 'output_text'
    if (Array.isArray(anyResp.output)) {
      for (const item of anyResp.output) {
        if (item?.type === 'message' && Array.isArray(item.content)) {
          for (const c of item.content) {
            if (
              c?.type === 'output_text' &&
              typeof c.text === 'string' &&
              c.text.trim()
            ) {
              return c.text.trim();
            }
          }
        }
      }
    }

    // 3. output 배열에서 다른 텍스트 필드 후보
    if (Array.isArray(anyResp.output)) {
      for (const item of anyResp.output) {
        if (typeof item?.text === 'string' && item.text.trim())
          return item.text.trim();
      }
    }

    // 4. 기타 하위 경로 (호환성)
    const fallbackCandidates = [
      anyResp?.content,
      anyResp?.text?.content,
      anyResp?.message?.content,
      anyResp?.output?.text,
      anyResp?.choices?.[0]?.message?.content,
    ];
    for (const cand of fallbackCandidates) {
      if (typeof cand === 'string' && cand.trim()) return cand.trim();
    }

    throw new Error('GPT-5 responses API 파싱 실패 (텍스트 경로 없음)');
  }

  private async callChatCompletionsAPI(
    userPrompt: string,
    systemPrompt?: string,
  ): Promise<string> {
    const messages: any[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: userPrompt,
    });

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o', // GPT-5가 완전히 출시될 때까지 GPT-4o 사용
      messages,
      max_tokens: 300,
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    });

    if (
      response.choices &&
      response.choices.length > 0 &&
      response.choices[0].message
    ) {
      return response.choices[0].message.content || '';
    }

    throw new Error('Chat Completions API에서 유효한 응답을 받지 못했습니다.');
  }

  // =====================================
  // 후처리 & 유틸
  // =====================================
  private postProcessQuestion(raw: string): string {
    if (!raw) return raw;
    let q = raw.trim();

    // 여러 줄이면 의미 있는 문장을 잇는다
    if (q.includes('\n')) {
      q = q
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ')
        .trim();
    }

    // 따옴표/괄호 제거 및 공백 정규화
    q = q
      .replace(/^[\s'"`“”'「『(\[]+/, '')
      .replace(/[\s'"`“”'」』)\]]+$/, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 스키마 허용 범위(120자)에 맞춰 부드럽게 자르기
    const MAX_LENGTH = 110;
    if (q.length > MAX_LENGTH) {
      const slice = q.slice(0, MAX_LENGTH + 1);
      const preferredBreaks = ['?', '!', '.', '…', ',', ' '];
      let cutIndex = -1;
      for (const token of preferredBreaks) {
        const idx = slice.lastIndexOf(token);
        if (idx >= 60) {
          cutIndex = idx;
          break;
        }
      }
      if (cutIndex === -1) {
        cutIndex = slice.lastIndexOf(' ');
      }
      if (cutIndex <= 0) {
        cutIndex = MAX_LENGTH;
      }
      q = slice.slice(0, cutIndex).trim();
    }

    const hadQuestionMark = /[?？]\s*$/.test(q);
    q = q.replace(/[,.;:\s]+$/g, '').trim();

    if (!hadQuestionMark && q.length <= 2) {
      return q;
    }

    if (hadQuestionMark || q.length > 2) {
      q += '?';
    }

    // 물음표 앞에 붙은 잔여 구두점 제거
    q = q.replace(/[,.;:\s]+([?？])$/g, '$1');

    return q;
  }
}
