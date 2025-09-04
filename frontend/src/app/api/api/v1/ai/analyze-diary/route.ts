import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, question, emotion } = await request.json();
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // 실제 구현에서는 OpenAI GPT API를 호출
    // 여기서는 임시로 구조화된 요약을 생성
    
    const prompt = `
다음 일기 내용을 분석하여 한국어로 요약해주세요:

질문: ${question || '자유 일기'}
감정: ${emotion || '😊'}
일기 내용: ${content}

다음 형식으로 요약해주세요:

📝 주요 내용: [일기의 핵심 내용을 2-3문장으로 요약]

😊 감정 분석: [작성자의 감정 상태와 기분 변화 분석]

🎯 핵심 키워드: [일기에서 중요한 키워드 3-5개]

💡 AI 조언: [긍정적이고 격려하는 조언 1-2문장]

🌟 성장 포인트: [개인적 성장이나 깨달음에 대한 언급]
`;

    // TODO: 실제 OpenAI API 호출
    // const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'gpt-3.5-turbo',
    //     messages: [
    //       {
    //         role: 'system',
    //         content: '당신은 일기 분석 전문가입니다. 사용자의 일기를 따뜻하고 긍정적으로 분석해주세요.'
    //       },
    //       {
    //         role: 'user',
    //         content: prompt
    //       }
    //     ],
    //     max_tokens: 500,
    //     temperature: 0.7,
    //   }),
    // });

    // const aiResponse = await openaiResponse.json();
    // const summary = aiResponse.choices[0].message.content;

    // 임시 응답 생성
    const summary = `📝 주요 내용: ${content.slice(0, 100)}...에 대한 소중한 경험과 생각을 기록해주셨습니다. 일상 속에서 찾은 의미 있는 순간들이 잘 드러나 있습니다.

😊 감정 분석: ${emotion === '😊' ? '전반적으로 긍정적이고 밝은' : 
               emotion === '😢' ? '다소 우울하지만 성찰적인' :
               emotion === '😡' ? '감정적이지만 솔직한' : '평온하고 안정적인'} 감정 상태를 보여주고 있습니다.

🎯 핵심 키워드: 일상, 성찰, 경험, 감정, 성장

💡 AI 조언: 오늘의 경험을 솔직하게 기록해주신 것이 정말 좋습니다. 이런 기록들이 모여 소중한 성장의 발자취가 될 것입니다.

🌟 성장 포인트: 일기를 통해 자신의 생각과 감정을 정리하고 표현하는 능력이 향상되고 있습니다.`;

    return NextResponse.json({
      summary,
      analysis: {
        emotion: emotion || '😊',
        wordCount: content.length,
        readingTime: Math.ceil(content.length / 200) + '분',
        keywords: ['일상', '성찰', '경험', '감정', '성장']
      }
    });

  } catch (error) {
    console.error('Diary analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze diary' }, 
      { status: 500 }
    );
  }
}
