// Import Dependencies
import { CloudArrowUpIcon } from "@heroicons/react/20/solid";
import { XMarkIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { forwardRef, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import PropTypes from "prop-types";

// Local Imports
import { Button, InputErrorMsg, Upload } from "components/ui";
import { useId } from "hooks";

// ----------------------------------------------------------------------

const PdfUpload = forwardRef(
  ({ label, value, onChange, error, classNames, existingFile }, ref) => {
    const id = useId();

    const { getRootProps, getInputProps, isDragReject, isDragAccept } =
      useDropzone({
        onDrop: useCallback((acceptedFiles) => {
          const file = acceptedFiles[0];
          if (file) {
            const ext = file.name.split('.').pop();
            const customName = `anexo_anuncio_${existingFile ? "editando" : "nuevo"}.${ext}`;

            const renamedFile = new File([file], customName, { type: file.type });

            onChange(renamedFile);
          }
        }, [onChange]),
        accept: {
          "application/pdf": [".pdf"],
        },
        multiple: false,
      });

    const onRemove = () => {
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
            "h-32 w-full rounded-lg border-2 border-dashed border-current flex items-center justify-center",
            !isDragAccept &&
            (isDragReject || error) &&
            "text-error dark:text-error-light",
            isDragAccept && "text-primary-600 dark:text-primary-500",
            !isDragReject &&
            !isDragAccept &&
            !error &&
            "text-gray-300 dark:text-dark-450",
            classNames?.box,
          )}
        >
          <Upload
            ref={ref}
            inputProps={{ ...getInputProps() }}
            {...getRootProps()}
          >
            {({ ...props }) =>
              value ? (
                <div className="flex items-center justify-between w-full px-4">
                  <div className="flex items-center gap-2 truncate">
                    <DocumentTextIcon className="size-6 text-primary-600 dark:text-primary-400" />
                    <span className="truncate text-gray-700 dark:text-dark-100">
                      {value.name}
                    </span>
                  </div>
                  <Button onClick={onRemove} className="size-6 shrink-0 rounded-full border p-0 dark:border-dark-450">
                    <XMarkIcon className="size-4" />
                  </Button>
                </div>
              ) : existingFile ? (
                <div className="flex items-center justify-between w-full px-4">
                  <div className="flex items-center gap-2 truncate">
                    <DocumentTextIcon className="size-6 text-primary-600 dark:text-primary-400" />
                    <a
                      href={existingFile}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-gray-700 dark:text-dark-100 underline"
                    >
                      {existingFile.split("/").pop()} {/* Extrae solo el nombre del archivo */}
                    </a>

                  </div>
                </div>
              ) : (
                <Button
                  unstyled
                  className="h-full w-full shrink-0 flex-col space-x-2 px-3"
                  {...props}
                >
                  <CloudArrowUpIcon className="pointer-events-none size-10" />
                  <span className="pointer-events-none mt-2 text-gray-600 dark:text-dark-200">
                    <span className="text-primary-600 dark:text-primary-400">
                      Browse
                    </span>
                    <span> or drop your PDF here</span>
                  </span>
                </Button>
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

PdfUpload.displayName = "PdfUpload";

PdfUpload.propTypes = {
  value: PropTypes.object,
  onChange: PropTypes.func,
  existingFile: PropTypes.string,
  error: PropTypes.oneOfType([PropTypes.bool, PropTypes.node]),
  classNames: PropTypes.object,
  label: PropTypes.node,
};

export { PdfUpload };
