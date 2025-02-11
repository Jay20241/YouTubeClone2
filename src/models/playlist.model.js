import mongoose, {Schema} from "mongoose";

const playlistSchema = new Schema(
    {
        videos: [ //this is array.
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],

        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }

        //Now add fields
    },
    {timestamps: true}
)

export const Playlist = mongoose.model("Playlist", playlistSchema)