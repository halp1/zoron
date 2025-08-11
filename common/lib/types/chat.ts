export namespace Chat {
  export interface Message {
    id: string;
    user: {
      name: string;
      icon?: string;
    };
    message: string;
    timestamp: number;
  }
}
