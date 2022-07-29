const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const { Cluster } = require('puppeteer-cluster')
const fs = require('fs')
puppeteer.use(StealthPlugin())

function wordlist() {
	return fs.readFileSync('wordlist.txt', {
		encoding: 'utf8'
	})
}

function writeContent(html) {
	fs.writeFile('logs/log.txt', html, err => {
		if (err) {
			console.error(err)
		}
	})
}

function getContent(html, start, end) {
    var str1 = html.split(start)
    var str2 = str1[1].split(end)

    return str2[0];
}

async function index() {
	(async() => {

		const cluster = await Cluster.launch({
			concurrency: Cluster.CONCURRENCY_CONTEXT,
			maxConcurrency: 2,
			puppeteerOptions: {
				sameDomainDelay: 1000,
				retryDelay : 3000,
				workerCreationDelay: 3000,
				arg : [
					'--no-sandbox',
				]
			}
		})

		await cluster.task(async ({ page, data}) => {

			await page.goto(data.url, {
				waitUntil : 'networkidle0'
			})

			const html = await page.content()

			writeContent(html)

			var propertyName = getContent(html, '<a class="font-600 text-secondary ng-binding" href="javascript:;">','</a>')

			console.log(propertyName)
		})

		var wordlistFile = wordlist()
		var _wl = wordlistFile.split('\n')

		for(var i = 0; i < _wl.length; i++) {
			console.log(`[+] ${_wl[i]} Queued ...🔥`)
			cluster.queue({
				url : _wl[i]
			})
		}

		await cluster.idle()
		await cluster.close()

	})()
}

index()