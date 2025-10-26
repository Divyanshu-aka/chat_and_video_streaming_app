import type { IUser } from "../utils/constants.js";
import type { Socket } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      user: IUser;
    }
  }
}

declare module "socket.io" {
  interface Socket {
    user?: IUser;
  }
}
