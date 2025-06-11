import { clsx } from "clsx";

export interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  className?: string;
  tableData: {
    headers: string[];
    data: {
      [key: string]: string;
    }[];
  };
}

export function Table({ className, tableData, ...tableProps }: TableProps) {
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
            key={row.id}
            className={clsx(
              index % 2 === 0
                ? "bg-gray-100 hover:bg-gray-200/50"
                : "hover:bg-gray-200/20",
              "border-b border-gray-200",
            )}
          >
            {tableData.headers.map((header, index) => (
              <td key={header} className="pl-1">
                {row[header]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
