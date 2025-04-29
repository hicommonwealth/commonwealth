import logging
import os
import secrets
import time
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo # Added imports
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
from telegram.constants import ChatAction

# --- Environment Variables & Logging ---
load_dotenv() # Load variables from .env file

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
# --- Get NGROK URL (Replace this manually for now) ---
# IMPORTANT: Replace this with the ACTUAL https URL from your running ngrok instance!
# In a real deployment, you wouldn't hardcode this.
NGROK_URL = "https://a88f-134-6-156-202.ngrok-free.app"

if not TELEGRAM_BOT_TOKEN:
    raise ValueError("TELEGRAM_BOT_TOKEN not found in .env file")


# Enable logging (helps with debugging)
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logging.getLogger("httpx").setLevel(logging.WARNING) # Quieter HTTP logs
logger = logging.getLogger(__name__)

# --- Constants and State ---
COMMON_LINK_URL = "https://common.xyz/auth/telegram/link" # Replace with actual URL when available
TOKEN_EXPIRY_SECONDS = 300 # 5 minutes

# Temporary Token Storage (Replace with DB/Cache later)
# Structure: {token: {"user_id": user_id, "timestamp": timestamp}}
link_tokens = {}

# Simulate Linked Users (Replace with DB check later)
# Structure: {telegram_user_id}
linked_user_ids = set()

# --- Helper Functions ---

def is_user_linked(user_id: int) -> bool:
    """Checks if the user's Telegram ID is in the set of linked users (simulation)."""
    # TODO: In production, this should query the Common backend DB/API
    return user_id in linked_user_ids

# --- NEW: Post Verification Message Function ---
async def send_post_verification_message(user_id: int, context: ContextTypes.DEFAULT_TYPE):
    """Sends a message to the user after successful account linking."""
    post_verify_text = (
        "Great! Your account is linked. ✨\n\n"
        "You can now:\n"
        "  • See your Aura points using /show_aura or /check_aura.\n"
        "  • Earn points automatically for helpful messages in groups.\n\n"
        "Use /help anytime to see all commands."
    )
    try:
        await context.bot.send_message(chat_id=user_id, text=post_verify_text)
    except Exception as e:
        logger.error(f"Failed to send post-verification message to {user_id}: {e}")

# --- Placeholder Functions (To be implemented) ---

async def analyze_message_helpfulness(message_text: str) -> bool:
    """
    Placeholder function to analyze message helpfulness using an LLM.
    Returns True if helpful, False otherwise.
    """
    logger.info(f"Placeholder: Analyzing message: '{message_text[:50]}...'")
    # TODO: Implement actual LLM API call here
    # Example: Based on keywords for now
    keywords = ["how to", "can you help", "explain", "resource", "link"]
    if any(keyword in message_text.lower() for keyword in keywords):
         logger.info("Placeholder: Classified as potentially helpful.")
         return True
    return False

async def award_aura_points(user_id: int, points: int):
    """
    Placeholder function to award Aura points to a user in the database.
    """
    if not is_user_linked(user_id):
        logger.info(f"User {user_id} is not linked, skipping point award.")
        # Optionally, you could DM the user here telling them to link their account
        return

    logger.info(f"Placeholder: Awarding {points} points to linked user {user_id}")
    # TODO: Implement database update logic here (e.g., using SQLite or another DB)
    pass

async def get_aura_points(user_id: int) -> int:
    """
    Placeholder function to retrieve Aura points for a user from the database.
    Assumes user is already verified if this is called.
    """
    logger.info(f"Placeholder: Getting points for linked user {user_id}")
    # TODO: Implement database query logic here
    # Example: Return a dummy value for now
    return 123 # Dummy value

# --- Bot Handlers ---

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends explanation on /start"""
    user_name = update.effective_user.first_name
    # --- Add Version Identifier --- 
    start_message_version = "v1.1-LinkCheck"
    # --- End Version Identifier ---
    await update.message.reply_text(
        f"Hi {user_name}! 👋 Welcome to the Common Rewards Bot ({start_message_version}).\n\n"
        "I help track helpful contributions in group chats and award Aura points. "
        "To get started and see your points, you first need to connect your Common account.\n\n"
        "➡️ Use /link_account to connect your account.\n"
        "❓ Use /help to see all available commands."
    )

# --- NEW: Help Command ---
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Displays a list of available commands and their descriptions."""
    help_text = (
        "Here's what I can do:\n\n"
        "🔗 /link_account - Connect your Common account to Telegram."
        "✅ /verify_user - Check if your account is linked."
        "📊 /show_aura - View your Aura points balance (requires linked account)."
        "💰 /check_aura - Get your Aura points balance as text (requires linked account)."
        "🆘 /help - Show this help message.\n\n"
        "(I also automatically analyze messages in groups I'm added to!)"
        # "\n🔧 /force_link - DEBUG ONLY: Manually link your account for testing."
    )
    await update.message.reply_text(help_text)

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles regular messages in groups, analyzes helpfulness, and awards points if user is linked."""
    message = update.message
    user = message.from_user
    message_text = message.text

    if not user or not message_text or message.chat.type == 'private': # Don't process private messages here
         # Only process messages in groups/supergroups for helpfulness analysis
        if message.chat.type != 'private':
             logger.info(f"Ignoring non-group message from {user.username} or non-text message.")
        return


    logger.info(f"Received group message from {user.username} (ID: {user.id}): '{message_text[:50]}...'")

    # Analyze message using LLM (placeholder)
    try:
        is_helpful = await analyze_message_helpfulness(message_text)

        if is_helpful:
            points_to_award = 5 # Example: Award 5 points for a helpful message
            # Award points only awards if user is linked (checked inside the function)
            await award_aura_points(user.id, points_to_award)
            # Avoid noisy replies in groups
            # logger.info(f"Awarded {points_to_award} points to {user.username} (ID: {user.id}) for helpful message.")

    except Exception as e:
        logger.error(f"Error processing message from {user.username}: {e}", exc_info=True)


async def check_aura_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles the /check_aura command (simple text reply, requires linking)."""
    user = update.effective_user
    if not user:
        return

    if not is_user_linked(user.id):
        await update.message.reply_text("Please link your Common account first using /link_account.")
        return

    try:
        points = await get_aura_points(user.id)
        await update.message.reply_text(f"Hi {user.first_name}, you currently have {points} Aura points. Use /show_aura for a detailed view.")
    except Exception as e:
        logger.error(f"Error fetching points for {user.username}: {e}", exc_info=True)
        await update.message.reply_text("Sorry, I couldn't fetch your points right now.")

# --- Web App Handler (Gated) ---
async def show_aura_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sends a button to open the Aura points Web App if user is linked."""
    user = update.effective_user
    if not user:
        return

    # --- Gate access based on linking status ---
    if not is_user_linked(user.id):
        await update.message.reply_text(
            "You need to link your Common account first.\n"
            "Please use the /link_account command."
        )
        return
    # --- End Gate ---

    # Create the button that opens the Web App
    # The URL MUST be the HTTPS ngrok URL pointing to your local web server
    keyboard = [
        [InlineKeyboardButton("📊 Show My Aura Points", web_app=WebAppInfo(url=NGROK_URL))]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    await update.message.reply_text(
        "Click the button below to see your Aura points:",
        reply_markup=reply_markup
    )

# --- Account Linking Handlers ---
async def link_account_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles the /link_account command. Generates a token and sends a standard URL link via DM."""
    user = update.effective_user # Use effective_user to handle different chat types
    if not user:
        return

    # Clean up expired tokens (simple approach)
    now = time.time()
    expired_tokens = [token for token, data in link_tokens.items() if now - data["timestamp"] > TOKEN_EXPIRY_SECONDS]
    for token in expired_tokens:
        if token in link_tokens: # Check if exists before deleting (async race condition safety)
            del link_tokens[token]
    logger.info(f"Cleaned up {len(expired_tokens)} expired link tokens.")


    # Generate unique token
    token = secrets.token_urlsafe(32)
    link_tokens[token] = {"user_id": user.id, "timestamp": now}

    # Construct the linking URL for the *real* Common platform endpoint
    linking_url = f"{COMMON_LINK_URL}?token={token}"

    logger.info(f"Generated link token {token} for user {user.id} ({user.username}). URL: {linking_url}")

    # Send the button via DM
    dm_text = (
        f"Click the button below to log in to your Common account ({COMMON_LINK_URL}) and link it to Telegram.\n\n"
        "This link will expire in 5 minutes.\n\n"
        "After successfully linking on the website, please return here and run /verify_user."
        " (For testing, use /force_link to simulate completion)."
    )
    # --- Use standard URL button --- 
    keyboard = [[InlineKeyboardButton("Link Common Account", url=linking_url)]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    try:
        await context.bot.send_message(
            chat_id=user.id,
            text=dm_text,
            reply_markup=reply_markup
        )
        # Optionally reply in the original chat if it wasn't a DM
        if update.message.chat.type != 'private':
             await update.message.reply_text("I've sent you a private message with a link to connect your account.")
        logger.info(f"Sent linking DM to user {user.id}")

    except Exception as e:
        # Handle cases where the bot can't DM the user (e.g., blocked)
        logger.error(f"Could not send DM to user {user.id}: {e}")
        await update.message.reply_text(
            "I couldn't send you a private message. Please ensure you haven't blocked me and try starting a chat with me first.",
             quote=True
        )

async def verify_user_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Checks if the user is linked (simulated)."""
    user = update.effective_user
    if not user:
        return

    # TODO: In production, this should query the Common backend API
    if is_user_linked(user.id):
        await update.message.reply_text("✅ Your Telegram account is linked to your Common account.")
    else:
        await update.message.reply_text(
            "❌ Your Telegram account is not linked.\n"
            "If you just linked on the Common website, please use /force_link to finalize (for testing)."
            "Otherwise, use /link_account to start."
        )


# --- Temporary command for testing linking ---
async def force_link_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """DEBUG: Manually marks the user as linked for testing purposes."""
    user = update.effective_user
    if not user:
        return

    if user.id not in linked_user_ids:
        linked_user_ids.add(user.id)
        logger.info(f"DEBUG: Force-linked user {user.id} ({user.username})")
        await update.message.reply_text("DEBUG: You have been manually marked as linked.")
        # --- Send post-verification message --- 
        await send_post_verification_message(user.id, context)
        # --- End Send post-verification message ---
    else:
        await update.message.reply_text("DEBUG: You were already marked as linked.")


# --- Main Bot Execution ---

def main() -> None:
    """Start the bot."""
    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()

    # Register handlers
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("check_aura", check_aura_command))
    application.add_handler(CommandHandler("show_aura", show_aura_command))
    application.add_handler(CommandHandler("link_account", link_account_command))
    application.add_handler(CommandHandler("verify_user", verify_user_command))
    application.add_handler(CommandHandler("force_link", force_link_command))

    # Handle non-command text messages ONLY in groups/supergroups
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND & (filters.ChatType.GROUPS | filters.ChatType.SUPERGROUP), handle_message))


    logger.info("Starting bot...")
    # Clear any pending updates from previous possibly conflicting runs
    application.run_polling(drop_pending_updates=True)

if __name__ == "__main__":
    main() 