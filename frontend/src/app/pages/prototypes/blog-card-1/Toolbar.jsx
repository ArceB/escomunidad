// src/app/pages/prototypes/blog-card-1/Toolbar.jsx

import PropTypes from "prop-types";
import {  useRef, useState } from "react";
import {
  Cog8ToothIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { RiFilter3Line } from "react-icons/ri";

import { Button, Input } from "components/ui";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useIsomorphicEffect } from "hooks";

// ----------------------------------------------------------------------

export function Toolbar({ query, setQuery }) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const mobileSearchRef = useRef();
  const { isXs } = useBreakpointsContext();

  useIsomorphicEffect(() => {
    if (showMobileSearch) mobileSearchRef?.current?.focus();
  }, [showMobileSearch]);

  return (
    <div className="flex items-center justify-between py-5 lg:py-6">
      {showMobileSearch && isXs ? (
        <Input
          classNames={{
            root: "flex-1",
            input: "h-9 text-xs-plus",
          }}
          value={query || ""}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar anuncios..."
          ref={mobileSearchRef}
          prefix={<MagnifyingGlassIcon className="size-4.5" />}
          suffix={
            <Button
              variant="flat"
              className="pointer-events-auto size-6 shrink-0 rounded-full p-0"
              onClick={() => {
                setQuery("");
                setShowMobileSearch(false);
              }}
            >
              <XMarkIcon className="size-4.5 text-gray-500 dark:text-dark-200" />
            </Button>
          }
        />
      ) : (
        <>
          {/* Título y menú */}
          <div className="flex min-w-0 items-center space-x-1">
            <h2 className="truncate text-xl font-medium text-gray-700 dark:text-dark-50 lg:text-2xl">
              Todos los Anuncios
            </h2>
          </div>

          {/* Buscador */}
          <div className="flex items-center space-x-1 ">
            <Input
              classNames={{
                input: "h-9 rounded-full text-xs-plus",
                root: "max-sm:hidden",
              }}
              value={query || ""}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar anuncios..."
              prefix={<MagnifyingGlassIcon className="size-4.5" />}
            />
            <Button
              onClick={() => setShowMobileSearch(true)}
              className="size-9 shrink-0 rounded-full sm:hidden"
              isIcon
              variant="flat"
            >
              <MagnifyingGlassIcon className="size-5" />
            </Button>

            <Button className="size-9 shrink-0 rounded-full" isIcon variant="flat">
              <RiFilter3Line className="size-5" />
            </Button>
            <Button className="size-9 shrink-0 rounded-full" isIcon variant="flat">
              <Cog8ToothIcon className="size-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------

Toolbar.propTypes = {
  query: PropTypes.string,
  setQuery: PropTypes.func,
};
