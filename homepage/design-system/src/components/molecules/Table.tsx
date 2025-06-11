"use client";
import { clsx } from "clsx";
import { toast } from "react-hot-toast";

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  className?: string;
  tableData: {
    headers: string[];
    data: {
      [key: string]: string | string[];
    }[];
  };
  copyable?: boolean;
}

export function Table({
  className,
  tableData,
  copyable,
  ...tableProps
}: TableProps) {
  return (
    <table
      className={clsx("w-full border border-gray-200 rounded-lg", className)}
      {...tableProps}
    >
      <thead>
        <tr>
          {tableData.headers.map((header) => (
            <th key={header} className="text-left pl-1">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="border-t border-gray-200">
        {tableData.data.map((row, index) => (
          <tr
            key={row.id as string}
            className={clsx(
              index % 2 === 0
                ? "bg-gray-100 hover:bg-gray-200/50"
                : "hover:bg-gray-200/20",
              "border-b border-gray-200",
            )}
          >
            {tableData.headers.map((header, index) => (
              <td
                key={header}
                className={clsx(
                  index === 0 && "pl-1",
                  typeof row[header] !== "string" && "flex",
                )}
              >
                {typeof row[header] !== "string" ? (
                  <TableDataContainer isCopyable={copyable}>
                    {row[header].map((item) => (
                      <div className="hover:underline" key={item}>
                        {item}
                      </div>
                    ))}
                  </TableDataContainer>
                ) : (
                  <TableDataContainer isCopyable={copyable}>
                    {row[header as keyof typeof row]}
                  </TableDataContainer>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const TableDataContainer = ({
  children,
  className,
  isCopyable,
}: { children: React.ReactNode; className?: string; isCopyable?: boolean }) => {
  return (
    <div
      className={clsx("flex gap-2", className, isCopyable && "cursor-pointer")}
      onClick={() => {
        if (isCopyable && children) {
          navigator.clipboard.writeText(children.toString());
          toast.success("Copied to clipboard");
        }
      }}
    >
      {children}
    </div>
  );
};
