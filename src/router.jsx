import Home from "@/pages/Home";
import { Marketplace } from "@/pages/Marketplace";
import { TradeIns } from "@/pages/TradeIns";
import { Settings } from "@/pages/Settings";
import { Warehouse } from "@/pages/Warehouse";
export const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/marketplace",
    element: <Marketplace />,
  },
  {
    path: "/tradeins",
    element: <TradeIns />,
  },
  {
    path: "/settings",
    element: <Settings />,
  },
  {
    path: "/warehouse",
    element: <Warehouse />,
  },
];
