import { createClient } from  'redis'

function getRedisURL(){
    const REDIS_URL = process.env.REDIS_URL
    if(!REDIS_URL){
        throw Error(`Set REDIS_URL env var`)
    }

    return REDIS_URL
}


function getZsetName(){
    const REDIS_ZSET_NAME = process.env.REDIS_ZSET_NAME
    if(!REDIS_ZSET_NAME){
        throw Error(`Set REDIS_ZSET_NAME env var`)
    }

    return REDIS_ZSET_NAME
}
export const REDIS_URL = getRedisURL()
export const REDIS_ZSET_NAME = getZsetName()


export const redisClient = createClient(REDIS_URL)
