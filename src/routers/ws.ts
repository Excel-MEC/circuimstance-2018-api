import { socketio } from '../App'
import LeaderboardApi from '../api/leaderboard'

socketio.on('connection',LeaderboardApi.onClientJoin)
