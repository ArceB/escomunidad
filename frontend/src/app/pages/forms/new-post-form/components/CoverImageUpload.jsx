// Import Dependencies
import { CloudArrowUpIcon } from "@heroicons/react/20/solid";
import { XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { forwardRef } from "react";
import PropTypes from "prop-types";

// Local Imports
import { PreviewImg } from "components/shared/PreviewImg";
import { Button, InputErrorMsg, Upload } from "components/ui";
import { useId } from "hooks";

// ----------------------------------------------------------------------

const CoverImageUpload = forwardRef(
  ({ label, value, onChange, error, classNames, existingImage }, ref) => {
    const id = useId();

    const handleFileChange = (e) => {
      const file = e?.target?.files?.[0];
      if (file) onChange(file);
    };

    const onRemove = (e) => {
      e?.stopPropagation?.();
      onChange(null);
    };

    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={id} className={classNames?.label}>
            {label}
          </label>
        )}

        <div
          className={clsx(
            "h-40 w-full rounded-lg border-2 border-dashed border-current flex items-center justify-center",
            error && "text-error dark:text-error-light",
            !error && "text-gray-300 dark:text-dark-450",
            classNames?.box
          )}
        >
          {/* Upload de la librería: SOLO un hijo tipo función */}
          <Upload
            ref={ref}
            inputProps={{
              accept: "image/png, image/jpeg, image/jpg",
              onChange: handleFileChange, // <- actualiza RHF
              name: id,
            }}
          >
            {(uploadProps) =>
              value ? (
                // Vista previa cuando ya hay un archivo nuevo seleccionado
                <div
                  title={value.name}
                  className="group relative h-full w-full rounded-lg ring-primary-600 ring-offset-4 ring-offset-white transition-all hover:ring-3 dark:ring-primary-500 dark:ring-offset-dark-700"
                >
                  <div className="h-full w-full overflow-hidden p-2">
                    <PreviewImg
                      className="m-auto h-full object-contain"
                      file={value}
                      alt={value.name}
                    />
                  </div>

                  <div className="absolute -right-3 -top-4 flex items-center justify-center rounded-full bg-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-dark-700">
                    <Button
                      onClick={onRemove}
                      className="size-6 shrink-0 rounded-full border p-0 dark:border-dark-450"
                    >
                      <XMarkIcon className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                // Zona clickeable para seleccionar archivo
                <button
                  type="button"
                  className="h-full w-full flex flex-col items-center justify-center px-3"
                  {...uploadProps} // <- muy importante: hace que el click abra el selector
                >
                  {existingImage ? (
                    <img
                      src={existingImage}
                      alt="Portada actual"
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <>
                      <CloudArrowUpIcon className="pointer-events-none size-12" />
                      <span className="pointer-events-none mt-2 text-gray-600 dark:text-dark-200">
                        <span className="text-primary-600 dark:text-primary-400">
                          Browse
                        </span>
                        <span> or drop your files here</span>
                      </span>
                    </>
                  )}
                </button>
              )
            }
          </Upload>
        </div>

        <InputErrorMsg
          when={error && typeof error !== "boolean"}
          className={classNames?.error}
        >
          {error}
        </InputErrorMsg>
      </div>
    );
  }
);

CoverImageUpload.displayName = "CoverImageUpload";

CoverImageUpload.propTypes = {
  value: PropTypes.object,
  id: PropTypes.string,
  onChange: PropTypes.func,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.node]),
  classNames: PropTypes.object,
  label: PropTypes.node,
  existingImage: PropTypes.string,
};

export { CoverImageUpload };
