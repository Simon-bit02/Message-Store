import type { Message } from "@keix/message-store-client";

export enum CommandTypeCredit {
  EARN_CREDITS = "EARN_CREDITS",
  USE_CREDITS = "USE_CREDITS",
}

export type EarnCredits = Message<CommandTypeCredit.EARN_CREDITS,{ id: string; amountCredit: number; transactionId?: string }>;
export type UseCredits = Message<CommandTypeCredit.USE_CREDITS,{ id: string; amountCredit: number; transactionId?: string }>;

export type CommandCredits = EarnCredits | UseCredits;

export enum EventTypeCredit {
  CREDITS_EARNED = "CREDITS_EARNED",
  CREDITS_USED = "CREDITS_USED",
  CREDITS_ERROR = "CREDITS_ERROR",
}

export type CreditsEarned = Message<EventTypeCredit.CREDITS_EARNED, { id: string; amountCredit: number; transactionId: string }>;
export type CreditsUsed = Message<EventTypeCredit.CREDITS_USED,{ id: string; amountCredit: number; transactionId: string }>;
export type CreditsError = Message<EventTypeCredit.CREDITS_ERROR,{ id: string; type: string }>;

export type EventCredits = CreditsEarned | CreditsUsed | CreditsError;

export enum CommandTypeCard {
  ADD_GIFT_CARD = "ADD_GIFT_CARD",
  UPDATE_GIFT_CARD = "UPDATE_GIFT_CARD",
  REMOVE_GIFT_CARD = "REMOVE_GIFT_CARD",
  REDEEM_GIFT_CARD = "REDEEM_GIFT_CARD",
  DELIVERY_GIFT_CARD = "DELIVERY_GIFT_CARD",
}

export type UpdateGiftCard = Message<CommandTypeCard.UPDATE_GIFT_CARD,{ id: string; name: string; description: string; image_url: string; amounts: number[];}>;
export type RemoveGiftCard = Message<CommandTypeCard.REMOVE_GIFT_CARD, { id: string }>;
export type AddedGiftCard = Message<CommandTypeCard.ADD_GIFT_CARD, {id: string;name: string; description: string; image_url: string; amounts: number[]; }>;
export type RedeemGiftCard = Message<CommandTypeCard.REDEEM_GIFT_CARD, { id: string; transactionId: string; idCard: string; amount: number }>;

export type DeliveryGiftCard = Message<CommandTypeCard.DELIVERY_GIFT_CARD, { id: string; transactionId: string; idCard: String }>;

export type CommandCard = UpdateGiftCard | RemoveGiftCard | AddedGiftCard | RedeemGiftCard | DeliveryGiftCard;

export enum EventTypeCard {
  GIFT_CARD_ERROR = "GIFT_CARD_ERROR",
  GIFT_CARD_UPDATED = "GIFT_CARD_UPDATED",
  GIFT_CARD_REMOVED = "GIFT_CARD_REMOVED",
  GIFT_CARD_ADDED = "GIFT_CARD_ADDED",
  GIFT_CARD_REDEEM_PENDING = "GIFT_CARD_REDEEM_PENDING",
  GIFT_CARD_REDEEM_PROCESSING = "GIFT_CARD_REDEEM_PROCESSING",
  GIFT_CARD_REDEEM_FAILED = "GIFT_CARD_REDEEM_FAILED",
  GIFT_CARD_REDEEM_SUCCEDED = "GIFT_CARD_REDEEM_SUCCEDED",
  GIFT_CARD_DELIVERED = "GIFT_CARD_DELIVERED"
}

export type GiftCardUpdated = Message<EventTypeCard.GIFT_CARD_UPDATED, { id: string; amounts: number[] }>;
export type GiftCardRemoved = Message<EventTypeCard.GIFT_CARD_REMOVED, { id: string }>;
export type GiftCardAdded = Message<EventTypeCard.GIFT_CARD_ADDED,{ id: string; amounts: number[]; name: string; description: string; image_url: string;}>;
export type GiftCardRedeemProcessing = Message<EventTypeCard.GIFT_CARD_REDEEM_PROCESSING,{}>;
export type GiftCardRedeemPending = Message<EventTypeCard.GIFT_CARD_REDEEM_PENDING,{}>;
export type GiftCardRedeemFailed = Message<EventTypeCard.GIFT_CARD_REDEEM_FAILED,{ id: string; type: string }>;
export type GiftCardRedeemSucceded = Message<EventTypeCard.GIFT_CARD_REDEEM_SUCCEDED,{ id: string }>;
export type GiftCardError = Message<EventTypeCard.GIFT_CARD_ERROR,{ type: string }>;
export type GiftCardDelivered = Message<EventTypeCard.GIFT_CARD_DELIVERED, {id: string}>;

export type EventCard = GiftCardUpdated | GiftCardRemoved | GiftCardAdded | GiftCardRedeemPending | GiftCardRedeemProcessing | GiftCardRedeemFailed | GiftCardRedeemSucceded | GiftCardError | GiftCardDelivered;