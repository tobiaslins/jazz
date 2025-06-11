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
            <th key={header} className="text-left">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="border-t border-gray-200">
        {tableData.data.map((row, index) => (
          <tr key={row.id} className={index % 2 === 0 ? "bg-gray-100" : ""}>
            {tableData.headers.map((header) => (
              <td key={header}>{row[header]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
