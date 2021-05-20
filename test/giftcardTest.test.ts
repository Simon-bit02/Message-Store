import { testUtils } from "@keix/message-store-client";
import { v4 } from "uuid";
import { runGiftCard } from "../src/index2";
import { 
  CommandTypeCredit, 
  EventTypeCredit, 
  CommandTypeCard, 
  EventTypeCard 
} from "../src/Types";

import {
  runGiftCardProjector,
  runAmountProjector,
  runDeliveryProjector,
  runErrorProjector,
  runPendingProjector,
  runProcessingProjector,
} from "../src/projector";

it("should add a card", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCard.ADD_GIFT_CARD,
      stream_name: "giftCard:command-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let event = testUtils.getStreamMessages("giftCard");
    expect(event).toHaveLength(1);
    expect(event[0].type).toEqual(EventTypeCard.GIFT_CARD_ADDED);
    expect(event[0].data.id).toEqual(idCard);
    expect(event[0].data.name).toEqual("Amazon");
    expect(event[0].data.amounts).toEqual([5, 10, 20, 30, 50]);
  });
});

it("shouldn't remove a card if not exist", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCard.REMOVE_GIFT_CARD,
      stream_name: "giftCard:command-" + idCard,
      data: {
        id: idCard,
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let event = testUtils.getStreamMessages("giftCard");
    expect(event).toHaveLength(1);
    expect(event[0].type).toEqual(EventTypeCard.GIFT_CARD_ERROR);
    expect(event[0].data.type).toEqual("CardNotExist");
  });
});

it("should remove a card", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: CommandTypeCard.REMOVE_GIFT_CARD,
      stream_name: "giftCard:command-" + idCard,
      data: {
        id: idCard,
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let event = testUtils.getStreamMessages("giftCard");
    expect(event).toHaveLength(2);
    expect(event[1].type).toEqual(EventTypeCard.GIFT_CARD_REMOVED);
    expect(event[1].data.id).toEqual(idCard);
  });
});

it("should update a card", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: CommandTypeCard.UPDATE_GIFT_CARD,
      stream_name: "giftCard:command-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frullatore",
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let event = testUtils.getStreamMessages("giftCard");
    expect(event).toHaveLength(2);
    expect(event[1].type).toEqual(EventTypeCard.GIFT_CARD_UPDATED);
    expect(event[1].data.id).toEqual(idCard);
  });
});

it("shouldn't update a card if not exist", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCard.UPDATE_GIFT_CARD,
      stream_name: "giftCard:command-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "Carta per comprarti il frullatore",
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let event = testUtils.getStreamMessages("giftCard");
    expect(event).toHaveLength(1);
    expect(event[0].type).toEqual(EventTypeCard.GIFT_CARD_ERROR);
    expect(event[0].data.type).toEqual("CardNotExist");
  });
});

it("shouldn't use a card if the amount not exist", async () => {
  let idCard = v4();
  let idAccount1 = v4();
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        id: idAccount1,
        amountCredit: 1000,
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: CommandTypeCard.REDEEM_GIFT_CARD,
      stream_name: "giftCardTransaction:command-" + idCard,
      data: {
        id: idCard,
        userId: idAccount1,
        amount: 55,
        transactionId: transactionId,
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let eventG = testUtils.getStreamMessages("giftCard");
    let eventT = testUtils.getStreamMessages("giftCardTransaction");
    expect(eventG).toHaveLength(1);
    expect(eventT).toHaveLength(2);
    expect(eventG[0].type).toEqual(EventTypeCard.GIFT_CARD_ADDED);
    expect(eventT[0].type).toEqual(EventTypeCard.GIFT_CARD_REDEEM_PENDING);
    expect(eventT[1].type).toEqual(EventTypeCard.GIFT_CARD_REDEEM_FAILED);
  });
});

it("should use a card if all stuffs are ok", async () => {
  let idCard = v4();
  let transactionId = v4();
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCredit.CREDITS_EARNED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        id: idAccount1,
        amountCredit: 1000,
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: {
        transactionId: transactionId,
        idCard: idCard,
        userId: idAccount1,
        amount: 50,
      },
    },
    {
      type: EventTypeCredit.CREDITS_USED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        id: idAccount1,
        amountCredit: 50,
        transactionId: transactionId,
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PROCESSING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: {
        transactionId: transactionId,
        idCard: idCard,
        userId: idAccount1,
      },
    },
    {
      type: CommandTypeCard.DELIVERY_GIFT_CARD,
      stream_name: "giftCardTransaction:command-" + transactionId,
      data: {
        transactionId: transactionId,
        idCard: idCard,
        userId: idAccount1,
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let eventG = testUtils.getStreamMessages("giftCard");
    let eventT = testUtils.getStreamMessages("giftCardTransaction");
    expect(eventG).toHaveLength(1);
    expect(eventT).toHaveLength(3);
    expect(eventG[0].type).toEqual(EventTypeCard.GIFT_CARD_ADDED);
    expect(eventT[0].type).toEqual(EventTypeCard.GIFT_CARD_REDEEM_PENDING);
    expect(eventT[1].type).toEqual(EventTypeCard.GIFT_CARD_REDEEM_PROCESSING);
    expect(eventT[2].type).toEqual(EventTypeCard.GIFT_CARD_REDEEM_SUCCEDED);
  });
});

it("should emit useCredit if the card exists and there is a valid amount", async () => {
  let transactionId = v4();
  let idAccount1 = v4();
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        idCard: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: CommandTypeCard.REDEEM_GIFT_CARD,
      stream_name: "giftCardTransaction:command-" + idCard,
      data: {
        idCard: idCard,
        userId: idAccount1,
        amount: 20,
        transactionId: transactionId,
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let eventT = testUtils.getStreamMessages("giftCardTransaction");
    let commandT = testUtils.getStreamMessages("creditAccount:command");
    expect(eventT).toHaveLength(1);
    expect(eventT[0].type).toEqual(EventTypeCard.GIFT_CARD_REDEEM_PENDING);
    expect(commandT[0].type).toEqual(CommandTypeCredit.USE_CREDITS);
  });
});

it("shouldn't delivery a card if is not in state of processing", async () => {
  let idCard = v4();
  let transactionId = v4();
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCard.DELIVERY_GIFT_CARD,
      stream_name: "giftCardTransaction:command-" + transactionId,
      data: {
        transactionId: transactionId,
        idCard: idCard,
        userId: idAccount1,
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let eventT = testUtils.getStreamMessages("giftCardTransaction");
    expect(eventT).toHaveLength(1);
    expect(eventT[0].type).toEqual(EventTypeCard.GIFT_CARD_REDEEM_FAILED);
  });
});

it("set redeem if the credits are used", async () => {
  let idCard = v4();
  let transactionId = v4();
  let idAccount1 = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: {
        transactionId: transactionId,
        idCard: idCard,
        userId: idAccount1,
        amount: 50,
      },
    },
    {
      type: EventTypeCredit.CREDITS_USED,
      stream_name: "creditAccount-" + idAccount1,
      data: {
        id: idAccount1,
        amountCredit: 50,
        transactionId: transactionId,
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let eventT = testUtils.getStreamMessages("giftCardTransaction");
    expect(eventT).toHaveLength(2);
    expect(eventT[1].type).toEqual(EventTypeCard.GIFT_CARD_REDEEM_PROCESSING);
  });
});

it("should find a existing card", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runGiftCardProjector(idCard)).toEqual(true);
});

it("shouldn't find a card if not exist", async () => {
  let idCard = v4();
  let idCardinesistente = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runGiftCardProjector(idCardinesistente)).toEqual(false);
});

it("shouldn't find a card if was removed", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REMOVED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
      },
    },
  ]);

  expect(await runGiftCardProjector(idCard)).toEqual(false);
});

it("should  if the amount exists", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runAmountProjector(idCard, 10)).toEqual(true);
});

it("shouldn't  an amount if not exists", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runAmountProjector(idCard, 12)).toEqual(false);
});

it("should return false if isn't in pending state", async () => {
  let idCard = v4();
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runPendingProjector(transactionId)).toEqual(false);
});

it("should return true if is in pending state", async () => {
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: {},
    },
  ]);

  expect(await runPendingProjector(transactionId)).toEqual(true);
});

it("should return false if isn't in processing state", async () => {
  let idCard = v4();
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: {
        id: transactionId,
      },
    },
  ]);

  expect(await runProcessingProjector(transactionId)).toEqual(false);
});

it("should return true if is in processing state", async () => {
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PROCESSING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: { id: transactionId },
    },
  ]);

  expect(await runProcessingProjector(transactionId)).toEqual(true);
});

it("should return false if isn't yet delivered", async () => {
  let idCard = v4();
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.com",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: {
        id: transactionId,
      },
    },
  ]);

  expect(await runDeliveryProjector(transactionId)).toEqual(false);
});

it("should return true if is already delivered", async () => {
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_SUCCEDED,
      stream_name: "giftCardTransaction-" + transactionId,
      data: { id: transactionId },
    },
  ]);

  expect(await runDeliveryProjector(transactionId)).toEqual(true);
});

it("should return false if there isn't an error", async () => {
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_SUCCEDED,
      stream_name: "giftCardTransaction-" + transactionId,
      data: { id: transactionId },
    },
  ]);

  expect(await runErrorProjector(transactionId)).toEqual(false);
});

it("should return true if there is an error", async () => {
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: {
        id: transactionId,
      },
    },
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_FAILED,
      stream_name: "giftCardTransaction-" + transactionId,
      data: {
        id: transactionId,
      },
    },
  ]);

  expect(await runErrorProjector(transactionId)).toEqual(true);
});