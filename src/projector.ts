import { runProjector } from "@keix/message-store-client";
import { EventCredits, EventTypeCredit, EventCard, EventTypeCard } from "./Types";

export async function runBalanceProjector(id: string): Promise<number> {
  const MAX_USE_CREDITS_DELAY = 365;

  let datetime = new Date();
  datetime.setDate(datetime.getDay() - MAX_USE_CREDITS_DELAY);
  function reducer(res: number, next: EventCredits) {
    if (next.time >= datetime) {
      if (next.type === EventTypeCredit.CREDITS_USED) {
        res -= next.data.amountCredit;
      } else if (next.type === EventTypeCredit.CREDITS_EARNED) {
        res += next.data.amountCredit;
      }
    }
    return Math.max(0, res);
  }
  return runProjector({ streamName: `creditAccount-${id}` }, reducer, 0);
}

export async function runCardExistProjector(id: string): Promise<boolean> {
  function reducer(prev: boolean, next: EventCard) {
    if (next.type === EventTypeCard.GIFT_CARD_ADDED) {
      return true;
    } else if (next.type === EventTypeCard.GIFT_CARD_REMOVED) {
      return false;
    } else {
      return prev;
    }
  }
  return runProjector({ streamName: `giftCard-${id}` }, reducer, false);
}

export async function runVerifyAmountProjector(id: string, amount: number): Promise<boolean> {
  function reducer(prev: boolean, next: EventCard) {
    if (next.type === EventTypeCard.GIFT_CARD_ADDED || next.type === EventTypeCard.GIFT_CARD_UPDATED) {
      return next.data.amounts.includes(amount);
    } else {
      return prev;
    }
  }
  return runProjector({ streamName: `giftCard-${id}` }, reducer, false);
}

export async function runVerifyPendingProjector(id: string): Promise<boolean> {
  function reducer(prev: boolean, next: EventCard) {
    if (next.type === EventTypeCard.GIFT_CARD_REDEEM_PENDING) {
      return true;
    } else {
      return false;
    }
  }
  return runProjector(
    { streamName: `giftCardTransaction-${id}` },
    reducer,
    false
  );
}

export async function runVerifyProcessingProjector(id: string): Promise<boolean> {
  function reducer(prev: boolean, next: EventCard) {
    if (next.type === EventTypeCard.GIFT_CARD_REDEEM_PROCESSING) {
      return true;
    } else {
      return false;
    }
  }
  return runProjector(
    { streamName: `giftCardTransaction-${id}` },
    reducer,
    false
  );
}

export async function runDeliveryProjector(id: string): Promise<boolean> {
  function reducer(prev: boolean, next: EventCard) {
    if (next.type === EventTypeCard.GIFT_CARD_DELIVERED) {
      return true;
    } else {
      return false;
    }
  }
  return runProjector(
    { streamName: `giftCardTransaction-${id}` },
    reducer,
    false
  );
}