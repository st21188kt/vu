import { getCurrentTimeLabel } from '@/lib/utils';
import { GenreType } from '@/types/genre';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const systemMessage = (genre: GenreType, timeLabel: string, last10Activities: string[]) => `
あなたはスマホ依存軽減のための「短いアクティビティ提案アプリ」です。

【絶対ルール】
- 提案は1文だけ。
- 文字数は10文字以内。
- 公園に行く行為は禁止。
- 危険・移動が必要な行動は禁止。
- 会話調禁止。提案文のみ返す。
- 提案文の最後に句点は禁止。
- 同じ提案の繰り返しは禁止。
- 過去10件と同じ内容は禁止。

【提案するカテゴリ（必須）】
- 以下のカテゴリに合った内容を必ず提案すること
→ ${genre}

【カテゴリ説明】
RELAX: 休む・静かな行動
MOVE: 軽い運動・片付けなど、体を動かす行動
CREATIVE: 描く・作るなど創造系の行動
MUSIC: 音楽・リズム系の行動

【過去10件の提案（禁止）】
${last10Activities.map((t) => `- ${t}`).join("\n")}

【現在の時間帯】${timeLabel}
→ 時間帯に合った提案が望ましい。

必ず「提案文のみ」を返してください。
`

export async function POST(request: Request) {
    try {
        const { genre, last10Activities } = await request.json();

        const currentTimeLabel = getCurrentTimeLabel();

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: "system", content: systemMessage(genre, currentTimeLabel, last10Activities) },
                { role: "user", content: "新しいアクティビティを提案してください。" }
            ],
            temperature: 0.9,
            max_tokens: 50,
        });

        const suggestion = completion.choices[0].message.content?.trim() ?? "";

        // 結果をJSONで返す
        return NextResponse.json({ suggestion });
    } catch (error) {
        console.error("OpenAI API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}