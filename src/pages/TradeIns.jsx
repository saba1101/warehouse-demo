import styles from "@/styles/TradeIns.module.scss";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/hooks/useUserData.js";
import { cars } from "@/data/cars.js";
import { FAKE_TRADE_USERS } from "@/data/tradeFakeUsers.js";

const formatPrice = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const formatMileage = (n) => new Intl.NumberFormat("en-US").format(n) + " mi";

const carsById = Object.fromEntries((cars || []).map((c) => [c.id, c]));

const OFFERS_COUNT = 10;

// Seeded random so same userData produces same offers until userData changes
function seededRandom(seed) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return () => {
    h = (Math.imul(16807, h) + 12345) | 0;
    return (Math.abs(h) % 1e7) / 1e7;
  };
}

function generateOffers(userData) {
  if (!userData?.cars?.length) return [];
  const userCarIds = userData.cars;
  const pool = cars.filter((c) => !userCarIds.includes(c.id));
  if (!pool.length) return [];

  const seed = userCarIds.join(",") + (userData.fixedCars?.length ?? 0);
  const random = seededRandom(seed);

  const getCarDisplay = (carId) => {
    const base = carsById[carId];
    if (!base) return null;
    const fixed = (userData.fixedCars || []).find((f) => f.id === carId);
    if (!fixed) return { ...base };
    return { ...base, condition: fixed.condition, price: fixed.price };
  };

  const offers = [];

  for (let i = 0; i < OFFERS_COUNT; i++) {
    const carWantedId = userCarIds[Math.floor(random() * userCarIds.length)];
    const carWanted = getCarDisplay(carWantedId);
    if (!carWanted) continue;

    const carOffered = pool[Math.floor(random() * pool.length)];
    if (!carOffered) continue;

    const fake =
      FAKE_TRADE_USERS[Math.floor(random() * FAKE_TRADE_USERS.length)];
    const message =
      fake.messages[Math.floor(random() * fake.messages.length)] ??
      fake.messages[0];

    offers.push({
      id: `offer-${i}-${carWantedId}-${carOffered.id}-${random()
        .toString(36)
        .slice(2, 9)}`,
      userName: fake.name,
      message,
      carOffered,
      carWantedId,
      carWanted,
    });
  }

  return offers;
}

export const TradeIns = () => {
  const { getUserData, addUserData, USER_DATA_UPDATED } = useUser();
  const [userData, setUserData] = useState(null);
  const [dismissedIds, setDismissedIds] = useState(new Set());

  useEffect(() => {
    const data = getUserData();
    const id = requestAnimationFrame(() => setUserData(data));
    const onUpdated = () => setUserData(getUserData());
    window.addEventListener(USER_DATA_UPDATED, onUpdated);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener(USER_DATA_UPDATED, onUpdated);
    };
  }, [getUserData, USER_DATA_UPDATED]);

  const offers = useMemo(() => {
    if (!userData) return [];
    return generateOffers(userData).filter((o) => !dismissedIds.has(o.id));
  }, [userData, dismissedIds]);

  const handleAcceptOffer = (offer) => {
    const current = getUserData();
    if (!current) return;
    const { carOffered, carWantedId, carWanted } = offer;

    let warehouseToUse = current.warehouseIds?.[0] ?? null;
    for (const [wid, ids] of Object.entries(current.warehouseInventory || {})) {
      if (Array.isArray(ids) && ids.includes(carWantedId)) {
        warehouseToUse = Number(wid);
        break;
      }
    }

    const priceDiff = carOffered.price - carWanted.price;
    const balanceNext = current.balance - priceDiff;

    const carsNext = current.cars.filter((id) => id !== carWantedId);
    if (!carsNext.includes(carOffered.id)) carsNext.push(carOffered.id);

    const warehouseInventory = { ...(current.warehouseInventory || {}) };
    for (const wid of Object.keys(warehouseInventory)) {
      if (!Array.isArray(warehouseInventory[wid])) continue;
      warehouseInventory[wid] = warehouseInventory[wid].filter(
        (id) => id !== carWantedId
      );
      if (Number(wid) === warehouseToUse) {
        if (!warehouseInventory[wid].includes(carOffered.id)) {
          warehouseInventory[wid] = [...warehouseInventory[wid], carOffered.id];
        }
      }
    }

    const fixedCarsNext = (current.fixedCars || []).filter(
      (f) => f.id !== carWantedId
    );

    const updatedUserData = {
      ...current,
      balance: balanceNext,
      cars: carsNext,
      warehouseInventory,
      fixedCars: fixedCarsNext,
    };
    addUserData(updatedUserData, true);
    setUserData(updatedUserData);
    setDismissedIds((prev) => new Set(prev).add(offer.id));
  };

  const handleDeclineOffer = (offerId) => {
    setDismissedIds((prev) => new Set(prev).add(offerId));
  };

  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Trade Ins</h1>
        <p className={styles.subtitle}>
          Trade your car for another. Price difference is added or subtracted
          from your balance.
        </p>
      </header>

      <section className={styles.section}>
        {offers.length === 0 ? (
          <p className={styles.empty}>
            {!userData?.cars?.length
              ? "You don't have any cars to trade. Buy cars from the Marketplace first."
              : "No trade offers right now. Check back later or buy more cars to see new offers."}
          </p>
        ) : (
          <ul className={styles.offerList}>
            {offers.map((offer) => {
              const diff = offer.carOffered.price - offer.carWanted.price;
              const youPay = diff > 0;
              return (
                <li key={offer.id} className={styles.offerCard}>
                  <div className={styles.offerHeader}>
                    <span className={styles.offerUserName}>
                      {offer.userName}
                    </span>
                    <p className={styles.offerMessage}>{offer.message}</p>
                  </div>
                  <div className={styles.offerCars}>
                    <div className={styles.offerCarBlock}>
                      <span className={styles.offerCarLabel}>They offer</span>
                      <span className={styles.offerCarName}>
                        {offer.carOffered.make} {offer.carOffered.model}
                      </span>
                      <span className={styles.offerCarMeta}>
                        {offer.carOffered.year} · {offer.carOffered.condition} ·{" "}
                        {formatPrice(offer.carOffered.price)}
                      </span>
                    </div>
                    <span className={styles.offerArrow}>⇄</span>
                    <div className={styles.offerCarBlock}>
                      <span className={styles.offerCarLabel}>For your</span>
                      <span className={styles.offerCarName}>
                        {offer.carWanted.make} {offer.carWanted.model}
                      </span>
                      <span className={styles.offerCarMeta}>
                        {offer.carWanted.year} · {offer.carWanted.condition} ·{" "}
                        {formatPrice(offer.carWanted.price)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.offerDiff}>
                    {diff === 0 ? (
                      <span className={styles.offerDiffEven}>Even trade</span>
                    ) : (
                      <span
                        className={
                          youPay ? styles.offerDiffPay : styles.offerDiffGain
                        }
                      >
                        {youPay
                          ? `You pay ${formatPrice(diff)}`
                          : `You receive ${formatPrice(-diff)}`}
                      </span>
                    )}
                  </div>
                  <div className={styles.offerActions}>
                    <button
                      type="button"
                      className={styles.offerDecline}
                      onClick={() => handleDeclineOffer(offer.id)}
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      className={styles.offerAccept}
                      onClick={() => handleAcceptOffer(offer)}
                      disabled={(getUserData()?.balance ?? 0) - diff < 0}
                      title={
                        (getUserData()?.balance ?? 0) - diff < 0
                          ? "Insufficient balance for this trade"
                          : undefined
                      }
                    >
                      Accept
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
};
