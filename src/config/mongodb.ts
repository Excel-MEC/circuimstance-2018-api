
function getMongoConnString(): string{
    let conn_str = process.env.MONGO_URI


    if(!conn_str){
        throw Error(`Could not find MONGO_URI`)
    }else{
        return conn_str
    }
}

export const MONGO_CONN_STRING = getMongoConnString() 
