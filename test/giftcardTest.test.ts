import { testUtils } from "@keix/message-store-client";
import { v4 } from "uuid";
import { runGiftCard } from "../src/index2";
import {runCardExistProjector, runVerifyAmountProjector, runVerifyPendingProjector, runVerifyProcessingProjector, } from "../src/projector";
import { CommandTypeCredit, EventTypeCredit, CommandTypeCard, EventTypeCard } from "../src/Types";

it("Add card", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCard.ADD_GIFT_CARD,
      stream_name: "giftCard:command-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono",
        image_url: "https://img",
        amounts: [5, 10, 20, 30, 40],
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let event = testUtils.getStreamMessages("giftCard");
    expect(event).toHaveLength(1);
    expect(event[0].type).toEqual(EventTypeCard.GIFT_CARD_ADDED);
    expect(event[0].data.id).toEqual(idCard);
    expect(event[0].data.name).toEqual("Amazon");
    expect(event[0].data.amounts).toEqual([5, 10, 20, 30, 40]);
  });
});

it("added card", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono",
        image_url: "https://img",
        amounts: [5, 10, 20, 30, 40],
      },
    },
  ]);

  expect(await runCardExistProjector(idCard)).toEqual(true);
});

it("shoulde be false if there isn't card", async () => {
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
        image_url: "https://img",
        amounts: [5, 10, 20, 30, 40],
      },
    },
  ]);

  expect(await runCardExistProjector(idCardinesistente)).toEqual(false);
});

// it("remove card", async () => {
//   let idCard = v4();
//   testUtils.setupMessageStore([
//     {
//       type: EventTypeCard.GIFT_CARD_ADDED,
//       stream_name: "giftCard-" + idCard,
//       data: {
//         id: idCard,
//         name: "Amazon",
//         description: "buono sconto",
//         image_url: "https://img",
//         amounts: [5, 10, 20, 30, 40],
//       },
//     },
//     {
//       type: EventTypeCard.GIFT_CARD_REMOVED,
//       stream_name: "giftCard-" + idCard,
//       data: {
//         id: idCard,
//       },
//     },
//   ]);

//   expect(await runCardExistProjector(idCard)).toEqual(false);
// });

it("Remove a non-existent card", async () => {
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
    expect(event[0].data.type).toEqual("not exist");
  });
});

it("Remove card", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img",
        amounts: [5, 10, 20, 30, 40],
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

it("Update card", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: CommandTypeCard.UPDATE_GIFT_CARD,
      stream_name: "giftCard:command-" + idCard,
      data: {
        id: idCard,
        name: "Sony",
        description: "portafoglio",
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

it("Update of a card that does not exist", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: CommandTypeCard.UPDATE_GIFT_CARD,
      stream_name: "giftCard:command-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
      },
    },
  ]);

  await testUtils.expectIdempotency(runGiftCard, () => {
    let event = testUtils.getStreamMessages("giftCard");
    expect(event).toHaveLength(1);
    expect(event[0].type).toEqual(EventTypeCard.GIFT_CARD_ERROR);
    expect(event[0].data.type).toEqual("not exist");
  });
});

it("check amount", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 40],
      },
    },
  ]);

  expect(await runVerifyAmountProjector(idCard, 10)).toEqual(true);
});

it("check amuont if not-exist", async () => {
  let idCard = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_ADDED,
      stream_name: "giftCard-" + idCard,
      data: {
        id: idCard,
        name: "Amazon",
        description: "buono sconto",
        image_url: "https://img",
        amounts: [5, 10, 20, 30, 40],
      },
    },
  ]);

  expect(await runVerifyAmountProjector(idCard, 15)).toEqual(false);
});

it("Use card", async () => {
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
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
    {
      type: CommandTypeCard.REDEEM_GIFT_CARD,
      stream_name: "giftCardTransaction:command-" + transactionId,
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
    expect(eventT[1].type).toEqual(EventTypeCard.GIFT_CARD_REDEEM_PROCESSING);
  });
});

it("should be false if isn't processing", async () => {
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
        image_url: "https://img.it",
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

  expect(await runVerifyProcessingProjector(transactionId)).toEqual(false);
});

it("should be true if is in processing", async () => {
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PROCESSING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: { id: transactionId },
    },
  ]);

  expect(await runVerifyProcessingProjector(transactionId)).toEqual(true);
});

it("use card if the amount is mistaken", async () => {
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
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 40],
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

it("should be false if not in pending", async () => {
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
        image_url: "https://img.it",
        amounts: [5, 10, 20, 30, 50],
      },
    },
  ]);

  expect(await runVerifyPendingProjector(transactionId)).toEqual(false);
});

it("should be true if is in pending", async () => {
  let transactionId = v4();
  testUtils.setupMessageStore([
    {
      type: EventTypeCard.GIFT_CARD_REDEEM_PENDING,
      stream_name: "giftCardTransaction-" + transactionId,
      data: {},
    },
  ]);

  expect(await runVerifyPendingProjector(transactionId)).toEqual(true);
});

