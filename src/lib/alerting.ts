import TelegramBot from 'node-telegram-bot-api';

export class AlertService {
  private static instance: AlertService;
  private bot: TelegramBot;
  private readonly chatIds: string[];
  private lastAlertTime: { [key: string]: number } = {};
  private readonly ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatIdsStr = process.env.TELEGRAM_CHAT_IDS;

    if (!token || !chatIdsStr) {
      throw new Error('Telegram configuration missing');
    }

    this.bot = new TelegramBot(token, { polling: false });
    this.chatIds = chatIdsStr.split(',');
  }

  public static getInstance(): AlertService {
    if (!AlertService.instance) {
      console.log('Creating new AlertService instance');
      AlertService.instance = new AlertService();
    }
    return AlertService.instance;
  }

  private canSendAlert(type: string): boolean {
    console.log('Checking alert cooldown for:', type);
    const now = Date.now();
    const lastTime = this.lastAlertTime[type] || 0;
    
    if (now - lastTime < this.ALERT_COOLDOWN) {
      return false;
    }
    
    this.lastAlertTime[type] = now;
    return true;
  }

  public async alert(type: string, message: string): Promise<void> {
    console.log('Sending alert:', type, message);
    if (!this.canSendAlert(type)) {
      console.log('Alert on cooldown, skipping');
      return;
    }

    const formattedMessage = `
🚨 Database Alert: ${type}
⏰ Time: ${new Date().toISOString()}
🌍 Environment: ${process.env.NODE_ENV}
📝 Details: ${message}
    `.trim();

    try {
      console.log('Sending Telegram alert:', formattedMessage);
      await Promise.all(
        this.chatIds.map(chatId => 
          this.bot.sendMessage(chatId, formattedMessage)
        )
      );
    } catch (error) {
      console.error('Failed to send Telegram alert:', error);
    }
  }
}
