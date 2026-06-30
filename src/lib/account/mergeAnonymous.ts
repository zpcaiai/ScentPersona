import { db } from "@/lib/db";

/**
 * Attach anonymous activity to a freshly logged-in user (Skill 38):
 * - claim orders created anonymously (by sessionId or matching phone)
 * - seed the UserScentProfile from the latest quiz session
 * - migrate "favorite" product events into UserFavoriteProduct
 */
export async function mergeAnonymous(
  userId: string,
  opts: { sessionId?: string | null; phone?: string | null }
): Promise<void> {
  const { sessionId, phone } = opts;

  // 1) Claim orders
  const orConds: Record<string, unknown>[] = [];
  if (sessionId) orConds.push({ sessionId });
  if (phone) orConds.push({ customerPhone: phone });
  if (orConds.length > 0) {
    await db.order.updateMany({ where: { userId: null, OR: orConds }, data: { userId } });
  }

  // 2) Seed scent profile from latest quiz session
  if (sessionId) {
    const session = await db.quizSession.findUnique({ where: { id: sessionId } });
    if (session) {
      await db.userScentProfile.upsert({
        where: { userId },
        create: {
          userId,
          currentPersonaId: session.personaId,
          scentScoresJson: session.tagScoresJson,
          likedProductIdsJson: session.recommendedProductIdsJson,
          lastQuizSessionId: session.id,
        },
        update: {
          currentPersonaId: session.personaId,
          scentScoresJson: session.tagScoresJson,
          likedProductIdsJson: session.recommendedProductIdsJson,
          lastQuizSessionId: session.id,
        },
      });
    }

    // 3) Migrate favorites recorded as anonymous product events
    const favEvents = await db.userProductEvent.findMany({
      where: { sessionId, eventType: "favorite", productId: { not: null } },
    });
    for (const ev of favEvents) {
      if (!ev.productId) continue;
      await db.userFavoriteProduct
        .upsert({
          where: { userId_productId: { userId, productId: ev.productId } },
          create: { userId, productId: ev.productId, productOfferId: ev.productOfferId },
          update: {},
        })
        .catch(() => undefined);
    }
  }
}
