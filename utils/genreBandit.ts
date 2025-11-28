import { GenreScore, GenreType } from "@/types/genre"
import { loadGenreScores, saveGenreScores } from "@/utils/storage"

const softmax = (genreScores: GenreScore[]): GenreScore[] => {
    const values = genreScores.map((item) => item.value)

    const maxValue = Math.max(...values)
    const exps = values.map((value) => Math.exp(value - maxValue))

    const sumExps = exps.reduce((sum, val) => sum + val, 0)
    
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

    // GenreScore配列を作成
    const genreScores: GenreScore[] = genres.map((genre, index) => ({
        key: genre,
        value: gaussianValues[index],
    }))

    return softmax(genreScores)
}

const updatePreference = (lr: number, genreScores: GenreScore[], genre: GenreType): GenreScore[] => {
    const selectionProbabilities: GenreScore[] = softmax(genreScores)

    const calculatedGenreScores: GenreScore[] = genreScores.map((item, index) => ({
        key: item.key,
        value: item.key === genre ? item.value + lr * (0.5) * (1 - selectionProbabilities[index].value) : item.value - lr * (-0.5) * selectionProbabilities[index].value,
    }))

    return softmax(calculatedGenreScores)
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