import { GenreScore, GenreType } from "@/types/genre"
import { loadGenreScores, saveGenreScores } from "@/utils/storage"

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

const generateGaussianRandom = (mean: number = 0, stddev: number = 1): number => {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    return z * stddev + mean
}


export const initializeGenreScores = (): GenreScore[] => {
    // ガウス分布に従う4つのランダム値を生成
    const gaussianValues = [
        generateGaussianRandom(0, 1),
        generateGaussianRandom(0, 1),
        generateGaussianRandom(0, 1),
        generateGaussianRandom(0, 1),
    ]

    // genreの順序を定義
    const genres: GenreType[] = ['RELAX', 'MOVE', 'CREATIVE', 'MUSIC']

    // GenreScore配列を作成（softmaxを適用しない、生の値を保持）
    const genreScores: GenreScore[] = genres.map((genre, index) => ({
        key: genre,
        value: gaussianValues[index],
    }))

    return genreScores
}

const updatePreference = (lr: number, genreScores: GenreScore[], genre: GenreType, reward: number = 1.0): GenreScore[] => {
    const selectionProbabilities: GenreScore[] = softmax(genreScores)

    // 平均報酬を計算（簡略版：0.5を使用）
    const avgReward = 0.5

    const calculatedGenreScores: GenreScore[] = genreScores.map((item, index) => ({
        key: item.key,
        value: item.key === genre
            ? item.value + lr * (reward - avgReward) * (1 - selectionProbabilities[index].value)
            : item.value - lr * (reward - avgReward) * selectionProbabilities[index].value,
    }))

    // 値をクリップして数値オーバーフロー対策
    const clippedGenreScores: GenreScore[] = calculatedGenreScores.map((item) => ({
        key: item.key,
        value: Math.max(-100, Math.min(100, item.value)), // -100 ~ 100 の範囲に制限
    }))

    // softmaxを適用せずに、生のスコアを返す
    return clippedGenreScores
}


export const genreBandit = (genre: GenreType): GenreScore[] => {
    // localStorageから読み込み、存在しない場合は初期化
    let genreScores = loadGenreScores('genreScores')

    if (genreScores === null) {
        genreScores = initializeGenreScores()
        saveGenreScores('genreScores', genreScores)
    }

    // updatePreference関数を実行（lr=0.1）
    const lr = 0.1
    const updatedGenreScores = updatePreference(lr, genreScores, genre)

    // 更新されたgenreScoresをlocalStorageに保存
    saveGenreScores('genreScores', updatedGenreScores)

    // 更新されたgenreScoresを返す
    return updatedGenreScores
}