interface TelegramWebApp {
  WebApp: {
    initData: string;
    initDataUnsafe: {
      query_id: string;
      user: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
        language_code?: string;
      };
      auth_date: number;
      hash: string;
    };
  };
}

declare global {
  interface Window {
    Telegram?: TelegramWebApp;
  }
} 