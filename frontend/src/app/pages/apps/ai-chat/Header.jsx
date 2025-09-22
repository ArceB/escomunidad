// Import Dependencies
import clsx from "clsx";

// Local Imports
import { useThemeContext } from "app/contexts/theme/context";
import { SidebarToggleBtn } from "components/shared/SidebarToggleBtn";

// ----------------------------------------------------------------------

export function Header() {
  const { cardSkin } = useThemeContext();

  return (
    <header
      className={clsx(
        cardSkin === "bordered" ? "dark:bg-dark-900" : "dark:bg-dark-750",
        "relative z-10 flex h-[65px] w-full shrink-0 items-center border-b border-gray-150 bg-white px-3 sm:px-6 shadow-xs dark:border-dark-600"
      )}
    >
      <div className="flex items-center gap-2">
        <SidebarToggleBtn />
        <h1 className="text-lg font-semibold text-gray-800 dark:text-dark-100">
          Chat
        </h1>
      </div>
    </header>
  );
}
