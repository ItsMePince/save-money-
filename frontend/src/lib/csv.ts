// @ts-nocheck
import { mkConfig, generateCsv, download } from "export-to-csv";

const csvConfig = mkConfig({
    fieldSeparator: ",",
    decimalSeparator: ".",
    useKeysAsHeaders: true,
    bom: true,
    useUtf8WithBom: true,
});

export function downloadCsvFile(filename: string, rows: any[]) {
    const csv = generateCsv(csvConfig)(rows);
    download(csvConfig)(csv, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}
