"use client";

import { useState } from "react";
import type { PosicionRow } from "@/lib/data/portfolio";
import AddPosition from "./modals/AddPosition";
import EditPosition from "./modals/EditPosition";
import ClosePosition from "./modals/ClosePosition";
import DeletePosition from "./modals/DeletePosition";
import UpdatePrice from "./modals/UpdatePrice";
import AddDividend from "./modals/AddDividend";

type ModalType = "add" | "edit" | "close" | "delete" | "price" | "dividend" | null;

interface Props {
  posiciones: PosicionRow[];
  openTickers: string[];
}

export default function ActionBar({ posiciones, openTickers }: Props) {
  const [modal, setModal] = useState<ModalType>(null);
  const close = () => setModal(null);

  return (
    <>
      <div className="action-bar">
        <button className="btn btn-primary" onClick={() => setModal("add")}>
          + Añadir posición
        </button>
        <button className="btn btn-secondary" onClick={() => setModal("edit")}>
          Editar posición
        </button>
        <button className="btn btn-secondary" onClick={() => setModal("close")}>
          Cerrar posición
        </button>
        <button className="btn btn-secondary" onClick={() => setModal("delete")}>
          Eliminar posición
        </button>
        <button className="btn btn-secondary" onClick={() => setModal("price")}>
          Actualizar cotización
        </button>
        <button className="btn btn-secondary" onClick={() => setModal("dividend")}>
          Añadir dividendo
        </button>
      </div>

      {modal === "add"      && <AddPosition onClose={close} />}
      {modal === "edit"     && <EditPosition posiciones={posiciones} onClose={close} />}
      {modal === "close"    && <ClosePosition posiciones={posiciones} onClose={close} />}
      {modal === "delete"   && <DeletePosition posiciones={posiciones} onClose={close} />}
      {modal === "price"    && <UpdatePrice openTickers={openTickers} onClose={close} />}
      {modal === "dividend" && <AddDividend openTickers={openTickers} onClose={close} />}
    </>
  );
}
