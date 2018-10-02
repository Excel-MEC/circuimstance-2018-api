
function getMongoConnString(): string{
    let conn_str = process.env.MONGO_CONN_STRING

    if(!conn_str){
        throw Error(`Could not find MONGO_CONN_STRING`)
    }else{
        return conn_str
    }
}

export const MONGO_CONN_STRING = getMongoConnString() 
