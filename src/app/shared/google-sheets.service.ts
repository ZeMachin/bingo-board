import { Injectable } from '@angular/core';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleSheetsService {
    /**
     * Retrieve rows from the configured Google Sheet.
     * - This runs server-side only (service account private key must not be exposed to the browser).
     * - Returns an array of objects keyed by header name with an additional `_rawData` array per row.
     */
    async getData(sheetIndex = 0): Promise<Record<string, any>[]> {
        // Guard: do not run in browser
        if (typeof window !== 'undefined') {
            console.warn('GoogleSheetsService.getData: called in browser; returning empty array.');
            return [];
        }

        try {
            const sheetId = environment.SHEET_ID;
            if (!sheetId) {
                console.warn('GoogleSheetsService.getData: no SHEET_ID configured.');
                return [];
            }

            const doc = new GoogleSpreadsheet(sheetId);

            await doc.useServiceAccountAuth({
                client_email: environment.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                // When private keys come from envs they often contain escaped newlines (`\n`).
                // Ensure we have real newlines before using the key.
                private_key: (environment.GOOGLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
            });

            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[sheetIndex];
            if (!sheet) return [];

            const rows = await sheet.getRows();
            const headers = sheet.headerValues || [];

            const data = rows.map((r: any) => {
                const obj: Record<string, any> = {};
                for (const h of headers) obj[h] = r[h];
                obj._rawData = r._rawData;
                return obj;
            });

            return data;
        } catch (err) {
            console.error('GoogleSheetsService.getData error', err);
            return [];
        }
    }
}