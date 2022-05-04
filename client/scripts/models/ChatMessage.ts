import moment from "moment";

export default class ChatMessage {
    public id?: number;
    public readonly address: string;
    public readonly message: string;
    public readonly chat_channel_id: number;
    public readonly created_at: moment.Moment;

    constructor(address: string, message: string, chat_channel_id: number, created_at: moment.Moment, id?: number) {
        this.id = id;
        this.address = address;
        this.message = message
        this.chat_channel_id = chat_channel_id;
        this.created_at = created_at;
    }
}