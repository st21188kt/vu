import { GenreScore } from "@/types/genre";

// softmax関数を定義（確率分布に変換）
const softmax = (genreScores: GenreScore[]): GenreScore[] => {
    const values = genreScores.map((item) => item.value)

    const maxValue = Math.max(...values)
    const exps = values.map((value) => {
        const exp = Math.exp(value - maxValue)
        // 数値オーバーフロー対策
        return isFinite(exp) ? exp : 0
    })

    const sumExps = exps.reduce((sum, val) => sum + val, 0)

    // ゼロ除算対策
    if (sumExps === 0) {
        return genreScores.map((item) => ({
            key: item.key,
            value: 1 / genreScores.length,
        }))
    }

    return genreScores.map((item, index) => ({
        key: item.key,
        value: exps[index] / sumExps,
    }))
}

export const selectGenre = (genreScores: GenreScore[]): GenreScore => {
    // genreScoresをsoftmaxで確率分布に変換
    const probabilities = softmax(genreScores)

    const random = Math.random()

    let cumulativeProbability = 0

    for (const probability of probabilities) {
        cumulativeProbability += probability.value

        if (random < cumulativeProbability) return probability
    }

    return probabilities[probabilities.length - 1]
}