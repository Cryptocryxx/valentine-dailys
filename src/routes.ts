import { createBrowserRouter } from "react-router";
import { PasswordGate } from "./components/PasswordGate";
import { Wordle } from "./components/wordle/Wordle";
import { Tango } from "./components/tango/Tango";
import { Crossword } from "./components/crossword/Crossword";
import { Connections } from "./components/connections/Connections";
import { Queens } from "./components/queens/Queens";
import { FinalMessage } from "./components/FinalMessage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: PasswordGate,
  },
  {
    path: "/quiz-1",
    Component: Wordle,
  },
  {
    path: "/quiz-2",
    Component: Tango,
  },
  {
    path: "/quiz-3",
    Component: Crossword,
  },
  {
    path: "/quiz-4",
    Component: Connections,
  },
  {
    path: "/quiz-5",
    Component: Queens,
  },
  {
    path: "/final",
    Component: FinalMessage,
  },
]);