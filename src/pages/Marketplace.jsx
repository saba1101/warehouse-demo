import styles from "@/styles/Marketplace.module.scss";
import { useState, useMemo, useEffect } from "react";
import { cars } from "@/data/cars";
import { warehouses } from "@/data/warehouses.js";
import { Modal } from "@/components/modal/modal.jsx";
import { useUser } from "@/hooks/useUserData.js";
const TAGS = [
  { value: "", label: "All" },
  { value: "warehouse", label: "Warehouse" },
  { value: "private", label: "Private Seller" },
];

const formatPrice = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const formatMileage = (n) => new Intl.NumberFormat("en-US").format(n) + " mi";

const VIEWS = [
  { value: "list", label: "List" },
  { value: "grid", label: "Cards" },
];

const CONDITION_ORDER = { poor: 0, fair: 1, good: 2, excellent: 3 };

const SORT_CONDITION = [
  { value: "", label: "Sort" },
  { value: "poor-excellent", label: "Poor → Excellent" },
  { value: "excellent-poor", label: "Excellent → Poor" },
];

export const Marketplace = () => {
  const [activeTag, setActiveTag] = useState("");
  const [search, setSearch] = useState("");
  const [sortCondition, setSortCondition] = useState("");
  const [view, setView] = useState("grid");
  const [confirmBuyCar, setConfirmBuyCar] = useState(null);
  const [buyCarSelectedWarehouseId, setBuyCarSelectedWarehouseId] =
    useState(null);
  const { getUserData, addUserData, USER_DATA_UPDATED } = useUser();
  const [userData, setUserData] = useState(null);

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

  const ownedCarIds = useMemo(
    () => (userData?.cars && Array.isArray(userData.cars) ? userData.cars : []),
    [userData]
  );

  const ownedWarehouseIds = useMemo(
    () =>
      userData?.warehouseIds && Array.isArray(userData.warehouseIds)
        ? userData.warehouseIds
        : [],
    [userData]
  );

  const ownedWarehouses = useMemo(
    () => warehouses.filter((w) => ownedWarehouseIds.includes(w.id)),
    [ownedWarehouseIds]
  );

  const hasWarehouse = ownedWarehouses.length > 0;

  const filteredCars = useMemo(() => {
    let list = cars;
    if (activeTag) {
      list = list.filter((car) => car.seller === activeTag);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (car) =>
          car.make.toLowerCase().includes(q) ||
          car.model.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTag, search]);

  const sortedCars = useMemo(() => {
    if (!sortCondition) return filteredCars;
    const order = (c) => CONDITION_ORDER[c.condition] ?? -1;
    const list = [...filteredCars];
    if (sortCondition === "poor-excellent") {
      list.sort((a, b) => order(a) - order(b));
    } else if (sortCondition === "excellent-poor") {
      list.sort((a, b) => order(b) - order(a));
    }
    return list;
  }, [filteredCars, sortCondition]);

  const canAfford = (price) => (userData?.balance ?? 0) >= price;
  const isOwned = (carId) => ownedCarIds.includes(carId);

  const handleBuyCarClick = (car) => {
    if (isOwned(car.id)) return;
    if (!hasWarehouse) {
      alert(
        "You need to own a warehouse to buy cars. Go to Warehouse to buy one."
      );
      return;
    }
    setConfirmBuyCar(car);
    const firstWithSpace = ownedWarehouses.find(
      (w) => (userData?.warehouseInventory?.[w.id] || []).length < w.capacity
    );
    setBuyCarSelectedWarehouseId(
      firstWithSpace?.id ?? ownedWarehouseIds[0] ?? null
    );
  };

  const getWarehouseCurrentCount = (warehouseId) =>
    (userData?.warehouseInventory?.[warehouseId] || []).length;

  const selectedWarehouseHasCapacity = useMemo(() => {
    if (buyCarSelectedWarehouseId == null) return false;
    const w = ownedWarehouses.find((x) => x.id === buyCarSelectedWarehouseId);
    if (!w) return false;
    const current = (
      userData?.warehouseInventory?.[buyCarSelectedWarehouseId] || []
    ).length;
    return current < w.capacity;
  }, [
    buyCarSelectedWarehouseId,
    ownedWarehouses,
    userData?.warehouseInventory,
  ]);

  const handleBuyConfirm = () => {
    if (!confirmBuyCar || buyCarSelectedWarehouseId == null) return;
    const current = getUserData();
    if (!current) return;
    if (current.cars.includes(confirmBuyCar.id)) {
      setConfirmBuyCar(null);
      setBuyCarSelectedWarehouseId(null);
      return;
    }
    if (current.balance < confirmBuyCar.price) {
      alert(
        `Insufficient funds. You have ${formatPrice(
          current.balance
        )}, this car costs ${formatPrice(confirmBuyCar.price)}.`
      );
      return;
    }
    const warehouse = warehouses.find(
      (w) => w.id === buyCarSelectedWarehouseId
    );
    const currentInWarehouse =
      (current.warehouseInventory &&
        current.warehouseInventory[buyCarSelectedWarehouseId]) ||
      [];
    if (warehouse && currentInWarehouse.length >= warehouse.capacity) {
      alert(
        `${warehouse.title} is full (${warehouse.capacity} / ${warehouse.capacity}). Choose another warehouse or free up space.`
      );
      return;
    }
    const warehouseInventory = { ...(current.warehouseInventory || {}) };
    warehouseInventory[buyCarSelectedWarehouseId] = [
      ...(warehouseInventory[buyCarSelectedWarehouseId] || []),
      confirmBuyCar.id,
    ];
    const updatedUserData = {
      ...current,
      balance: current.balance - confirmBuyCar.price,
      cars: [...current.cars, confirmBuyCar.id],
      warehouseInventory,
    };
    addUserData(updatedUserData, true);
    setUserData(updatedUserData);
    setConfirmBuyCar(null);
    setBuyCarSelectedWarehouseId(null);
  };

  const closeBuyModal = () => {
    setConfirmBuyCar(null);
    setBuyCarSelectedWarehouseId(null);
  };

  return (
    <main className={styles.wrapper}>
      <header className={styles.header}>
        <h1 className={styles.title}>Marketplace</h1>
        <div className={styles.controls}>
          <div className={styles.tags}>
            {TAGS.map(({ value, label }) => (
              <button
                key={value || "all"}
                type="button"
                className={`${styles.tag} ${
                  activeTag === value ? styles.active : ""
                }`}
                onClick={() => setActiveTag(value)}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            type="text"
            className={styles.search}
            placeholder="Search make or model…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className={styles.sortCondition}>
            {SORT_CONDITION.filter((o) => o.value !== "").map(
              ({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`${styles.tag} ${
                    sortCondition === value ? styles.active : ""
                  }`}
                  onClick={() =>
                    setSortCondition(sortCondition === value ? "" : value)
                  }
                >
                  {label}
                </button>
              )
            )}
          </div>
          <div className={styles.viewToggle}>
            {VIEWS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`${styles.viewButton} ${
                  view === value ? styles.viewActive : ""
                }`}
                onClick={() => setView(value)}
                title={label}
                aria-pressed={view === value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {view === "grid" && (
        <div className={styles.grid}>
          {sortedCars.length === 0 ? (
            <p className={styles.empty}>No cars match your filters.</p>
          ) : (
            sortedCars.map((car) => (
              <article key={car.id} className={styles.card}>
                <div className={styles.cardImage}>
                  <div className={styles.cardBadges}>
                    <span
                      className={`${styles.conditionBadge} ${
                        styles[car.condition]
                      }`}
                    >
                      {car.condition}
                    </span>
                    <span className={styles.sellerBadge}>
                      {car.seller === "warehouse" ? "Warehouse" : "Private"}
                    </span>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <h2 className={styles.cardTitle}>
                    {car.make} {car.model}
                  </h2>
                  <p className={styles.cardMeta}>
                    {car.year} · {formatMileage(car.mileage)}
                  </p>
                  <p className={styles.cardPrice}>{formatPrice(car.price)}</p>
                  <span className={styles.cardPriceLabel}>Asking price</span>
                  <button
                    onClick={() => handleBuyCarClick(car)}
                    type="button"
                    className={styles.buyButton}
                    disabled={
                      isOwned(car.id) || !canAfford(car.price) || !hasWarehouse
                    }
                    title={
                      isOwned(car.id)
                        ? "You already own this car"
                        : !hasWarehouse
                        ? "Buy a warehouse first"
                        : !canAfford(car.price)
                        ? "Insufficient funds"
                        : undefined
                    }
                  >
                    {isOwned(car.id)
                      ? "Owned"
                      : !hasWarehouse
                      ? "Need warehouse"
                      : !canAfford(car.price)
                      ? "Can't afford"
                      : "Buy"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {view === "list" && (
        <div className={styles.list}>
          {sortedCars.length === 0 ? (
            <p className={styles.empty}>No cars match your filters.</p>
          ) : (
            sortedCars.map((car) => (
              <article key={car.id} className={styles.listRow}>
                <div className={styles.listImage}>
                  <span
                    className={`${styles.conditionBadge} ${
                      styles[car.condition]
                    }`}
                  >
                    {car.condition}
                  </span>
                  <span className={styles.sellerBadge}>
                    {car.seller === "warehouse" ? "Warehouse" : "Private"}
                  </span>
                </div>
                <div className={styles.listBody}>
                  <h2 className={styles.listTitle}>
                    {car.make} {car.model}
                  </h2>
                  <p className={styles.listMeta}>
                    {car.year} · {formatMileage(car.mileage)}
                  </p>
                </div>
                <div className={styles.listPrice}>
                  <span className={styles.listPriceValue}>
                    {formatPrice(car.price)}
                  </span>
                  <span className={styles.cardPriceLabel}>Asking price</span>
                </div>
                <button
                  onClick={() => handleBuyCarClick(car)}
                  type="button"
                  className={styles.buyButtonList}
                  disabled={
                    isOwned(car.id) || !canAfford(car.price) || !hasWarehouse
                  }
                  title={
                    isOwned(car.id)
                      ? "You already own this car"
                      : !hasWarehouse
                      ? "Buy a warehouse first"
                      : !canAfford(car.price)
                      ? "Insufficient funds"
                      : undefined
                  }
                >
                  {isOwned(car.id)
                    ? "Owned"
                    : !hasWarehouse
                    ? "Need warehouse"
                    : !canAfford(car.price)
                    ? "Can't afford"
                    : "Buy"}
                </button>
              </article>
            ))
          )}
        </div>
      )}

      <Modal open={!!confirmBuyCar} onClose={closeBuyModal} title="Buy car">
        {confirmBuyCar && (
          <div className={styles.buyModal}>
            <p className={styles.buyModalMessage}>
              {confirmBuyCar.make} {confirmBuyCar.model} —{" "}
              {formatPrice(confirmBuyCar.price)}
            </p>
            <p className={styles.buyModalBalance}>
              Your balance: {formatPrice(getUserData()?.balance ?? 0)} → after:{" "}
              {formatPrice((getUserData()?.balance ?? 0) - confirmBuyCar.price)}
            </p>
            <label
              className={styles.buyModalLabel}
              htmlFor="buy-warehouse-select"
            >
              Store in warehouse
            </label>
            <select
              id="buy-warehouse-select"
              className={styles.buyModalSelect}
              value={buyCarSelectedWarehouseId ?? ""}
              onChange={(e) =>
                setBuyCarSelectedWarehouseId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
            >
              {ownedWarehouses.map((w) => {
                const count = getWarehouseCurrentCount(w.id);
                const full = count >= w.capacity;
                return (
                  <option key={w.id} value={w.id} disabled={full}>
                    {w.title} ({w.location}) — {count}/{w.capacity}
                    {full ? " (full)" : ""}
                  </option>
                );
              })}
            </select>
            {!selectedWarehouseHasCapacity &&
              buyCarSelectedWarehouseId != null && (
                <p className={styles.buyModalFull}>
                  Selected warehouse is full. Choose another.
                </p>
              )}
            <div className={styles.buyModalActions}>
              <button
                type="button"
                className={styles.buyModalCancel}
                onClick={closeBuyModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.buyModalConfirm}
                onClick={handleBuyConfirm}
                disabled={
                  buyCarSelectedWarehouseId == null ||
                  !selectedWarehouseHasCapacity ||
                  ownedCarIds.includes(confirmBuyCar.id) ||
                  (getUserData()?.balance ?? 0) < confirmBuyCar.price
                }
              >
                Buy
              </button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  );
};
