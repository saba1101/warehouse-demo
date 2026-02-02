import styles from "@/styles/Warehouse.module.scss";
import { useState, useEffect, useMemo } from "react";
import { useUser } from "@/hooks/useUserData.js";
import { warehouses } from "@/data/warehouses.js";
import { cars } from "@/data/cars.js";
import { Modal } from "@/components/modal/modal.jsx";
import { ConfirmModal } from "@/components/modal/ConfirmModal.jsx";

const TABS = [
  { value: "owned", label: "My Warehouses" },
  { value: "purchase", label: "Purchase Warehouse" },
];

const WAREHOUSE_SUB_TABS = [
  { value: "cars", label: "Cars" },
  { value: "parts", label: "Parts" },
];

const SALVAGE_MULTIPLIERS = {
  poor: 1.3,
  fair: 1.4,
  good: 1.5,
  excellent: 2.0,
};

const formatPrice = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const formatMileage = (n) => new Intl.NumberFormat("en-US").format(n) + " mi";

const carsById = Object.fromEntries((cars || []).map((c) => [c.id, c]));

const FIX_PRICES = { good: 1000, fair: 2000, poor: 4000 };

const WAREHOUSE_SELL_DIVISOR = 1.2; // selling price = price / 1.2 (usage decrease)

export const Warehouse = () => {
  const { getUserData, addUserData, USER_DATA_UPDATED } = useUser();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("owned");
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [carModalCar, setCarModalCar] = useState(null);
  const [confirmSalvageCar, setConfirmSalvageCar] = useState(null);
  const [confirmBuyWarehouse, setConfirmBuyWarehouse] = useState(null);
  const [confirmSellWarehouse, setConfirmSellWarehouse] = useState(null);
  const [warehouseSubview, setWarehouseSubview] = useState("cars");

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    const data = getUserData();
    const id = requestAnimationFrame(() => setUserData(data));
    const onUserDataUpdated = () => setUserData(getUserData());
    window.addEventListener(USER_DATA_UPDATED, onUserDataUpdated);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener(USER_DATA_UPDATED, onUserDataUpdated);
    };
  }, [getUserData, USER_DATA_UPDATED]);

  const ownedIds = useMemo(
    () =>
      userData?.warehouseIds && Array.isArray(userData.warehouseIds)
        ? userData.warehouseIds
        : [],
    [userData]
  );

  const ownedWarehouses = useMemo(
    () => warehouses.filter((w) => ownedIds.includes(w.id)),
    [ownedIds]
  );

  const purchaseWarehouses = useMemo(
    () => warehouses.filter((w) => !ownedIds.includes(w.id)),
    [ownedIds]
  );

  const parts = useMemo(
    () =>
      userData?.parts && Array.isArray(userData.parts) ? userData.parts : [],
    [userData]
  );

  // Merge base car with fixedCar from localStorage (condition + sell price).
  const getCarDisplay = (carId) => {
    const base = carsById[carId];
    if (!base) return null;
    const fixed = (userData?.fixedCars || []).find((f) => f.id === carId);
    if (!fixed) return { ...base };
    return { ...base, condition: fixed.condition, price: fixed.price };
  };

  const getInventoryCars = (warehouse) => {
    const ids =
      userData?.warehouseInventory?.[warehouse.id] &&
      Array.isArray(userData.warehouseInventory[warehouse.id])
        ? userData.warehouseInventory[warehouse.id]
        : [];
    return ids.map((id) => getCarDisplay(id)).filter(Boolean);
  };

  const handleSellCar = (car) => {
    const current = getUserData();
    if (!current) return;
    const carsNext = current.cars.filter((c) => c !== car.id);
    const warehouseInventory = { ...(current.warehouseInventory || {}) };
    for (const wid of current.warehouseIds || []) {
      if (Array.isArray(warehouseInventory[wid])) {
        warehouseInventory[wid] = warehouseInventory[wid].filter(
          (id) => id !== car.id
        );
      }
    }
    const fixedCarsNext = (current.fixedCars || []).filter(
      (f) => f.id !== car.id
    );

    const updatedUserData = {
      ...current,
      balance: current.balance + car.price,
      cars: carsNext,
      warehouseInventory,
      fixedCars: fixedCarsNext,
    };
    addUserData(updatedUserData, true);
    setUserData(updatedUserData);
    setCarModalCar(null);
  };

  const handleBuyWarehouse = (warehouse) => {
    const current = getUserData();
    if (!current) return;
    if (current.balance < warehouse.price) {
      alert(
        `Insufficient funds. You have ${formatPrice(
          current.balance
        )}, this warehouse costs ${formatPrice(warehouse.price)}.`
      );
      return;
    }
    const warehouseIdsNext = [...(current.warehouseIds || []), warehouse.id];
    const warehouseInventoryNext = {
      ...(current.warehouseInventory || {}),
      [warehouse.id]: [],
    };
    const updatedUserData = {
      ...current,
      balance: current.balance - warehouse.price,
      warehouseIds: warehouseIdsNext,
      warehouseInventory: warehouseInventoryNext,
    };
    addUserData(updatedUserData, true);
    setUserData(updatedUserData);
    setConfirmBuyWarehouse(null);
  };

  const handleSellWarehouse = (warehouse) => {
    const current = getUserData();
    if (!current) return;
    const carIdsInWarehouse =
      (current.warehouseInventory &&
        current.warehouseInventory[warehouse.id]) ||
      [];
    let carsTotal = 0;
    for (const carId of carIdsInWarehouse) {
      const display = getCarDisplay(carId);
      if (display) carsTotal += display.price;
    }
    const partsInWarehouse = (current.parts || []).filter(
      (p) => p.warehouseId === warehouse.id
    );
    const partsTotal = partsInWarehouse.reduce(
      (sum, p) => sum + p.sellValue,
      0
    );
    const warehouseSellPrice = Math.floor(
      warehouse.price / WAREHOUSE_SELL_DIVISOR
    );
    const balanceNext =
      current.balance + carsTotal + partsTotal + warehouseSellPrice;
    const carsNext = (current.cars || []).filter(
      (id) => !carIdsInWarehouse.includes(id)
    );
    const fixedCarsNext = (current.fixedCars || []).filter(
      (f) => !carIdsInWarehouse.includes(f.id)
    );
    const partsNext = (current.parts || []).filter(
      (p) => p.warehouseId !== warehouse.id
    );
    const warehouseIdsNext = (current.warehouseIds || []).filter(
      (id) => id !== warehouse.id
    );
    const warehouseInventoryNext = { ...(current.warehouseInventory || {}) };
    delete warehouseInventoryNext[warehouse.id];

    const updatedUserData = {
      ...current,
      balance: balanceNext,
      cars: carsNext,
      fixedCars: fixedCarsNext,
      parts: partsNext,
      warehouseIds: warehouseIdsNext,
      warehouseInventory: warehouseInventoryNext,
    };
    addUserData(updatedUserData, true);
    setUserData(updatedUserData);
    setConfirmSellWarehouse(null);
  };

  const handleFixCar = (car) => {
    const current = getUserData();
    if (!current) return;
    if (
      car.condition === "excellent" ||
      (current.fixedCars || []).some((f) => f.id === car.id)
    ) {
      return;
    }
    const fixPrice = FIX_PRICES[car.condition];
    if (fixPrice == null || current.balance < fixPrice) {
      if (current.balance < (fixPrice ?? 0)) {
        alert(
          `Insufficient funds. You have ${formatPrice(
            current.balance
          )}, fixing costs ${formatPrice(fixPrice)}.`
        );
      }
      return;
    }
    const sellPriceAfterFix = car.price + fixPrice * 1.5;
    const fixedCarsNext = [
      ...(current.fixedCars || []),
      { id: car.id, condition: "excellent", price: sellPriceAfterFix },
    ];
    const updatedUserData = {
      ...current,
      balance: current.balance - fixPrice,
      fixedCars: fixedCarsNext,
    };
    addUserData(updatedUserData, true);
    setUserData(updatedUserData);
    setCarModalCar(null);
  };

  const handleSalvageCar = (car) => {
    const current = getUserData();
    if (!current) return;
    let warehouseId = null;
    for (const [wid, ids] of Object.entries(current.warehouseInventory || {})) {
      if (Array.isArray(ids) && ids.includes(car.id)) {
        warehouseId = Number(wid);
        break;
      }
    }
    const multiplier = SALVAGE_MULTIPLIERS[car.condition] ?? 1;
    const sellValue = Math.floor(car.price * multiplier);
    const partId = `part-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 9)}`;
    const part = {
      id: partId,
      carId: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      condition: car.condition,
      sellValue,
      warehouseId,
    };
    const carsNext = current.cars.filter((c) => c !== car.id);
    const warehouseInventory = { ...(current.warehouseInventory || {}) };
    for (const wid of current.warehouseIds || []) {
      if (Array.isArray(warehouseInventory[wid])) {
        warehouseInventory[wid] = warehouseInventory[wid].filter(
          (id) => id !== car.id
        );
      }
    }
    const fixedCarsNext = (current.fixedCars || []).filter(
      (f) => f.id !== car.id
    );
    const partsNext = [...(current.parts || []), part];
    const updatedUserData = {
      ...current,
      cars: carsNext,
      warehouseInventory,
      fixedCars: fixedCarsNext,
      parts: partsNext,
    };
    addUserData(updatedUserData, true);
    setUserData(updatedUserData);
    setCarModalCar(null);
    setConfirmSalvageCar(null);
  };

  const handleSellPart = (part) => {
    const current = getUserData();
    if (!current) return;
    const partsNext = (current.parts || []).filter((p) => p.id !== part.id);
    const updatedUserData = {
      ...current,
      balance: current.balance + part.sellValue,
      parts: partsNext,
    };
    addUserData(updatedUserData, true);
    setUserData(updatedUserData);
  };

  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Warehouse</h1>
        <div className={styles.tabs}>
          {TABS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`${styles.tab} ${
                activeTab === value ? styles.tabActive : ""
              }`}
              onClick={() => setActiveTab(value)}
              aria-pressed={activeTab === value}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === "owned" && (
        <section className={styles.section}>
          {ownedWarehouses.length === 0 ? (
            <p className={styles.empty}>
              You don’t own any warehouses yet. Use the Purchase Warehouse tab
              to buy one.
            </p>
          ) : (
            <div className={styles.ownedGrid}>
              {ownedWarehouses.map((warehouse) => {
                const inventoryCars = getInventoryCars(warehouse);
                const partsInWarehouse = parts.filter(
                  (p) => p.warehouseId === warehouse.id
                );
                const isExpanded = expandedIds.has(warehouse.id);
                return (
                  <article
                    key={warehouse.id}
                    className={`${styles.card} ${styles.cardOwned} ${
                      isExpanded ? styles.cardExpanded : ""
                    }`}
                  >
                    <button
                      type="button"
                      className={styles.cardSummary}
                      onClick={() => toggleExpanded(warehouse.id)}
                      aria-expanded={isExpanded}
                    >
                      <div className={styles.cardSummaryLeft}>
                        <h2 className={styles.cardTitle}>{warehouse.title}</h2>
                        <span className={styles.cardLocation}>
                          {warehouse.location}
                        </span>
                      </div>
                      <div className={styles.cardSummaryRight}>
                        <span className={styles.cardCapacity}>
                          {inventoryCars.length}/{warehouse.capacity}
                        </span>
                        <span className={styles.cardChevron} aria-hidden>
                          {isExpanded ? "▼" : "▶"}
                        </span>
                      </div>
                    </button>
                    {isExpanded && (
                      <div className={styles.cardExpandable}>
                        <p className={styles.cardDescription}>
                          {warehouse.description}
                        </p>
                        <div className={styles.cardMeta}>
                          <span>{warehouse.condition}</span>
                          <span>{warehouse.security} security</span>
                          {warehouse.hasLoadingDock && (
                            <span className={styles.badge}>Loading dock</span>
                          )}
                        </div>
                        <div className={styles.cardUpkeep}>
                          Upkeep {formatPrice(warehouse.monthlyUpkeep)}/mo
                        </div>
                        <button
                          type="button"
                          className={styles.sellWarehouseButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmSellWarehouse(warehouse);
                          }}
                        >
                          Sell warehouse
                        </button>
                        <div className={styles.warehouseSubTabs}>
                          {WAREHOUSE_SUB_TABS.map(({ value, label }) => (
                            <button
                              key={value}
                              type="button"
                              className={`${styles.warehouseSubTab} ${
                                warehouseSubview === value
                                  ? styles.warehouseSubTabActive
                                  : ""
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setWarehouseSubview(value);
                              }}
                              aria-pressed={warehouseSubview === value}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {warehouseSubview === "cars" && (
                          <div className={styles.inventory}>
                            <h3 className={styles.inventoryTitle}>Cars</h3>
                            {inventoryCars.length === 0 ? (
                              <p className={styles.inventoryEmpty}>
                                No cars stored
                              </p>
                            ) : (
                              <ul className={styles.inventoryList}>
                                {inventoryCars.map((car) => (
                                  <li
                                    key={car.id}
                                    className={`${styles.inventoryItem} ${
                                      car.condition ? styles[car.condition] : ""
                                    }`.trim()}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setCarModalCar(car)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        setCarModalCar(car);
                                      }
                                    }}
                                  >
                                    <span className={styles.inventoryCarName}>
                                      {car.make} {car.model}
                                    </span>
                                    <span className={styles.inventoryCarMeta}>
                                      {car.year} · {formatMileage(car.mileage)}{" "}
                                      · {car.condition}
                                    </span>
                                    <span className={styles.inventoryCarPrice}>
                                      {formatPrice(car.price)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                        {warehouseSubview === "parts" && (
                          <div className={styles.inventory}>
                            <h3 className={styles.inventoryTitle}>Parts</h3>
                            {partsInWarehouse.length === 0 ? (
                              <p className={styles.inventoryEmpty}>
                                No salvaged parts. Salvage a car from Cars to
                                get parts (poor ×1.3, fair ×1.4, good ×1.5,
                                excellent ×2.0).
                              </p>
                            ) : (
                              <ul className={styles.partsList}>
                                {partsInWarehouse.map((part) => (
                                  <li
                                    key={part.id}
                                    className={`${styles.partsItem} ${
                                      part.condition
                                        ? styles[part.condition]
                                        : ""
                                    }`.trim()}
                                  >
                                    <div className={styles.partsItemInfo}>
                                      <span className={styles.partsItemName}>
                                        {part.make} {part.model} parts
                                      </span>
                                      <span className={styles.partsItemMeta}>
                                        {part.year} · {part.condition} ·{" "}
                                        {formatPrice(part.sellValue)}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      className={styles.partsSellButton}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSellPart(part);
                                      }}
                                    >
                                      Sell {formatPrice(part.sellValue)}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {activeTab === "purchase" && (
        <section className={styles.section}>
          {purchaseWarehouses.length === 0 ? (
            <p className={styles.empty}>
              You already own all available warehouses.
            </p>
          ) : (
            <div className={styles.purchaseGrid}>
              {purchaseWarehouses.map((warehouse) => (
                <article
                  key={warehouse.id}
                  className={`${styles.card} ${styles.cardPurchase}`}
                >
                  <div className={styles.cardHeader}>
                    <h2 className={styles.cardTitle}>{warehouse.title}</h2>
                    <span className={styles.cardLocation}>
                      {warehouse.location}
                    </span>
                    <p className={styles.cardDescription}>
                      {warehouse.description}
                    </p>
                    <div className={styles.cardMeta}>
                      <span>Capacity {warehouse.capacity}</span>
                      <span>{warehouse.condition}</span>
                      <span>{warehouse.security} security</span>
                      {warehouse.hasLoadingDock && (
                        <span className={styles.badge}>Loading dock</span>
                      )}
                    </div>
                    <div className={styles.cardPrice}>
                      {formatPrice(warehouse.price)}
                    </div>
                    <p className={styles.cardPriceLabel}>One-time purchase</p>
                    <p className={styles.cardUpkeep}>
                      {formatPrice(warehouse.monthlyUpkeep)}/mo upkeep
                    </p>
                    <button
                      type="button"
                      className={styles.buyButton}
                      onClick={() => setConfirmBuyWarehouse(warehouse)}
                      disabled={(userData?.balance ?? 0) < warehouse.price}
                    >
                      Buy warehouse
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      <Modal
        open={!!carModalCar}
        onClose={() => setCarModalCar(null)}
        title={"Car Details"}
      >
        {carModalCar &&
          (() => {
            const isFixed = (userData?.fixedCars || []).some(
              (f) => f.id === carModalCar.id
            );
            const fixPrice = FIX_PRICES[carModalCar.condition];
            const canFix =
              fixPrice != null &&
              !isFixed &&
              carModalCar.condition !== "excellent";
            const gainFromFix = fixPrice != null ? fixPrice * 1.5 : 0;
            const sellPriceAfterFix =
              fixPrice != null
                ? carModalCar.price + gainFromFix
                : carModalCar.price;
            return (
              <div className={styles.carModal}>
                <h2 className={styles.carModalTitle}>
                  {carModalCar.make} {carModalCar.model}
                </h2>
                <dl className={styles.carModalDetails}>
                  <div className={styles.carModalRow}>
                    <dt>Year</dt>
                    <dd>{carModalCar.year}</dd>
                  </div>
                  <div className={styles.carModalRow}>
                    <dt>Condition</dt>
                    <dd
                      className={`${styles.carModalCondition} ${
                        styles[carModalCar.condition] || ""
                      }`.trim()}
                    >
                      {carModalCar.condition}
                    </dd>
                  </div>
                  <div className={styles.carModalRow}>
                    <dt>Mileage</dt>
                    <dd>{formatMileage(carModalCar.mileage)}</dd>
                  </div>
                  <div className={styles.carModalRow}>
                    <dt>Sell price</dt>
                    <dd className={styles.carModalPrice}>
                      {formatPrice(carModalCar.price)}
                    </dd>
                  </div>
                  <div className={styles.carModalRow}>
                    <dt>Seller</dt>
                    <dd>
                      {carModalCar.seller === "warehouse"
                        ? "Warehouse"
                        : "Private"}
                    </dd>
                  </div>
                  {carModalCar.warehouseId != null && (
                    <div className={styles.carModalRow}>
                      <dt>Warehouse ID</dt>
                      <dd>{carModalCar.warehouseId}</dd>
                    </div>
                  )}
                  {canFix && (
                    <>
                      <div className={styles.carModalRow}>
                        <dt>Fix cost</dt>
                        <dd>{formatPrice(fixPrice)}</dd>
                      </div>
                      <div className={styles.carModalRow}>
                        <dt>Gain from fix</dt>
                        <dd className={styles.carModalGain}>
                          {formatPrice(gainFromFix)}
                        </dd>
                      </div>
                      <div className={styles.carModalRow}>
                        <dt>Sell price after fix</dt>
                        <dd className={styles.carModalPrice}>
                          {formatPrice(sellPriceAfterFix)}
                        </dd>
                      </div>
                    </>
                  )}
                  {isFixed && (
                    <div className={styles.carModalRow}>
                      <dt>Status</dt>
                      <dd className={styles.carModalFixed}>
                        Fixed — sell for {formatPrice(carModalCar.price)}
                      </dd>
                    </div>
                  )}
                </dl>
                <div className={styles.carModalActions}>
                  <button
                    onClick={() => handleSellCar(carModalCar)}
                    type="button"
                    className={styles.carModalSell}
                  >
                    Sell for {formatPrice(carModalCar.price)}
                  </button>
                  {canFix && (
                    <button
                      type="button"
                      className={styles.carModalFix}
                      onClick={() => handleFixCar(carModalCar)}
                    >
                      Fix ({formatPrice(fixPrice)})
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.carModalSalvage}
                    onClick={() => setConfirmSalvageCar(carModalCar)}
                  >
                    Salvage
                  </button>
                </div>
              </div>
            );
          })()}
      </Modal>

      <ConfirmModal
        open={!!confirmBuyWarehouse}
        onClose={() => setConfirmBuyWarehouse(null)}
        title="Buy warehouse"
        message={
          confirmBuyWarehouse
            ? `Buy ${confirmBuyWarehouse.title} for ${formatPrice(
                confirmBuyWarehouse.price
              )}? Your balance after purchase: ${formatPrice(
                (userData?.balance ?? 0) - confirmBuyWarehouse.price
              )}.`
            : ""
        }
        confirmLabel="Buy"
        cancelLabel="Cancel"
        onConfirm={() =>
          confirmBuyWarehouse && handleBuyWarehouse(confirmBuyWarehouse)
        }
      />

      <ConfirmModal
        open={!!confirmSellWarehouse}
        onClose={() => setConfirmSellWarehouse(null)}
        title="Sell warehouse"
        message={
          confirmSellWarehouse
            ? (() => {
                const carIds =
                  (userData?.warehouseInventory &&
                    userData.warehouseInventory[confirmSellWarehouse.id]) ||
                  [];
                const carsTotal = carIds.reduce((sum, id) => {
                  const d = getCarDisplay(id);
                  return sum + (d ? d.price : 0);
                }, 0);
                const partsInWh =
                  (userData?.parts || []).filter(
                    (p) => p.warehouseId === confirmSellWarehouse.id
                  ) || [];
                const partsTotal = partsInWh.reduce(
                  (sum, p) => sum + p.sellValue,
                  0
                );
                const warehouseSell = Math.floor(
                  confirmSellWarehouse.price / WAREHOUSE_SELL_DIVISOR
                );
                const total = carsTotal + partsTotal + warehouseSell;
                const partsText =
                  partsInWh.length > 0
                    ? ` plus ${formatPrice(partsTotal)} from ${
                        partsInWh.length
                      } part${partsInWh.length === 1 ? "" : "s"}`
                    : "";
                const carsText =
                  carIds.length > 0
                    ? ` plus ${formatPrice(carsTotal)} from ${
                        carIds.length
                      } car${carIds.length === 1 ? "" : "s"}`
                    : "";
                return `Sell ${
                  confirmSellWarehouse.title
                }? You will receive ${formatPrice(
                  warehouseSell
                )} for the warehouse (usage-adjusted)${carsText}${partsText}. Total: ${formatPrice(
                  total
                )}. This cannot be undone.`;
              })()
            : ""
        }
        confirmLabel="Sell"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() =>
          confirmSellWarehouse && handleSellWarehouse(confirmSellWarehouse)
        }
      />

      <ConfirmModal
        open={!!confirmSalvageCar}
        onClose={() => setConfirmSalvageCar(null)}
        title="Salvage car"
        message={
          confirmSalvageCar
            ? `Are you sure you want to salvage this ${
                confirmSalvageCar.make
              } ${
                confirmSalvageCar.model
              }? The car will be removed and you will get parts (sell value: ${formatPrice(
                Math.floor(
                  confirmSalvageCar.price *
                    (SALVAGE_MULTIPLIERS[confirmSalvageCar.condition] ?? 1)
                )
              )}). This cannot be undone.`
            : ""
        }
        confirmLabel="Salvage"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() =>
          confirmSalvageCar && handleSalvageCar(confirmSalvageCar)
        }
      />
    </main>
  );
};
