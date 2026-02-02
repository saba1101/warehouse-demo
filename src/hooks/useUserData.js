import { useCallback, useMemo } from "react";
import { warehouses } from "@/data/warehouses.js";
import { cars } from "@/data/cars.js";
export function useUser() {
  const user = useMemo(() => localStorage.getItem("userData"), []);

  const doesUserExist = useMemo(() => {
    return user !== null && user !== undefined && user !== "undefined";
  }, [user]);

  const USER_DATA_KEY = "userData";
  const USER_DATA_UPDATED = "userDataUpdated";

  const getUserData = useCallback(() => {
    try {
      const raw = localStorage.getItem(USER_DATA_KEY);
      if (raw == null || raw === "undefined") return null;
      const data = JSON.parse(raw);
      if (!data) return null;
      const warehouseInventory =
        data.warehouseInventory && typeof data.warehouseInventory === "object"
          ? data.warehouseInventory
          : {};
      Object.keys(warehouseInventory).forEach((k) => {
        if (!Array.isArray(warehouseInventory[k])) warehouseInventory[k] = [];
      });
      return {
        ...data,
        warehouseIds: Array.isArray(data.warehouseIds) ? data.warehouseIds : [],
        cars: Array.isArray(data.cars) ? data.cars : [],
        warehouseInventory,
        fixedCars: Array.isArray(data.fixedCars) ? data.fixedCars : [],
        parts: Array.isArray(data.parts) ? data.parts : [],
      };
    } catch {
      return null;
    }
  }, []);

  const addUserData = useCallback((userData, isUpdate = false) => {
    const preOwnedWarehouse = 22;
    const initialCars = warehouses
      .find((w) => w.id === preOwnedWarehouse)
      .inventory.map((id) => cars.find((c) => c.id === id).id);
    const presets = isUpdate
      ? userData
      : {
          balance: 3000,
          warehouseIds: [preOwnedWarehouse],
          cars: initialCars,
          warehouseInventory: { [preOwnedWarehouse]: [...initialCars] },
          fixedCars: [],
          parts: [],
          background: "default",
        };
    const next = { ...userData, ...presets };
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(USER_DATA_UPDATED, { detail: next }));
  }, []);

  const updateUserData = useCallback(
    (updates) => {
      const current = getUserData();
      if (!current) return;
      const next = { ...current, ...updates };
      if (updates.cars !== undefined)
        next.cars = Array.isArray(updates.cars) ? updates.cars : current.cars;
      if (updates.warehouseIds !== undefined)
        next.warehouseIds = Array.isArray(updates.warehouseIds)
          ? updates.warehouseIds
          : current.warehouseIds;
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(next));
      window.dispatchEvent(
        new CustomEvent(USER_DATA_UPDATED, { detail: next })
      );
    },
    [getUserData]
  );

  const deleteUserData = useCallback(() => {
    localStorage.removeItem("userData");
  }, []);

  return {
    doesUserExist,
    getUserData,
    addUserData,
    updateUserData,
    deleteUserData,
    USER_DATA_UPDATED,
  };
}
