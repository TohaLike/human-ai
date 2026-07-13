import { VKUpdate } from './types'

export class VKMessageParser {
  parse(update: VKUpdate) {
    if (update[0] !== 10004) {
      return null
    }

    return {
      id: update[3],
      peerId: update[4],
      date: new Date(update[5] * 1000),
      text: update[6],
      flags: update[2],
      isMine: (update[2] & 2) !== 0 || update[2] === 1
    }
  }
}
