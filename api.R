uri <- "https://agbindzy99.execute-api.us-east-1.amazonaws.com/prod/lambdar?e"
file.name <- "/Users/Adeel/Dropbox/Documents/Fannie Mae/Analytics Job Description 2017.pdf"

library(httr)
res <- POST(
  url = uri,
  body = RCurl::base64Encode(readBin(file.name, "raw", file.info(file.name)[1, "size"]))
)
rawToChar(res$content)
