// Import Dependencies
import PropTypes from "prop-types";
import { RiRobot2Line } from "react-icons/ri";
import ReactMarkdown from "react-markdown"; // 👈 nuevo

// Local Imports
import { Avatar, Box, Skeleton } from "components/ui";
import { profile } from "../data";

// ----------------------------------------------------------------------

export function Message({ role, content }) {
  const isUser = role === "user";

  return (
    <div className="data-conversation-panel space-y-4">
      {isUser ? (
        // 📌 Mensaje del usuario (derecha)
        <div className="flex items-end justify-end gap-2.5 ltr:ml-4 sm:ltr:ml-10 rtl:mr-4 sm:rtl:mr-10">
          <Box className="max-w-lg rounded-2xl bg-gray-150 p-3 dark:bg-dark-700">
            {content}
          </Box>
          <div className="size-10 max-sm:hidden">
            <Avatar
              size={10}
              initialColor="auto"
              src={profile.avatar}
              name={profile.name}
            />
          </div>
        </div>
      ) : (
        // 📌 Mensaje del asistente (izquierda)
        <div className="flex items-end justify-start gap-2.5 sm:gap-5 ltr:mr-4 sm:ltr:mr-10 rtl:ml-4 sm:rtl:ml-10">
          <div className="size-10 max-sm:hidden">
            <Avatar size={10} initialColor="info">
              <RiRobot2Line className="size-5" />
            </Avatar>
          </div>
          <Box className="w-full max-w-lg rounded-2xl border border-gray-200 p-3 dark:border-dark-600">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {content === "" ? (
                <div className="flex flex-1 flex-col justify-between space-y-2 py-2">
                  {Array(3)
                    .fill()
                    .map((_, index) => (
                      <Skeleton key={index} className="h-3 w-full rounded-sm" />
                    ))}
                  <Skeleton className="h-3 w-1/3 rounded-sm" />
                </div>
              ) : (
                <ReactMarkdown>{content}</ReactMarkdown>
              )}
            </div>
          </Box>
        </div>
      )}
    </div>
  );
}

Message.propTypes = {
  role: PropTypes.oneOf(["user", "assistant"]).isRequired,
  content: PropTypes.string.isRequired,
};
