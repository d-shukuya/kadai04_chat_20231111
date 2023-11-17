// ChatRoom クラス
class ChatRoom {
    // DB用のオブジェクト
    #roomKey = "";
    set RoomKey(val) {
      this.#roomKey = val;
    }
    get RoomKey() {
      return this.#roomKey;
    }
  
    #roomName = "";
    set RoomName(val) {
      this.#roomName = val;
    }
    get RoomName() {
      return this.#roomName;
    }
  
    constructor(key, name) {
      this.RoomKey = key;
      this.RoomName = name;
    }
  
    Key() {
      return this.RoomKey;
    }
  
    Val() {
      return {
        roomName: this.RoomName,
      };
    }
  }