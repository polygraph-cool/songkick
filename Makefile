# requires gac
archive:
	zip -r archive.zip dist/dev

live:
	rm -rf docs
	cp -r dist/prod/ docs
	gac 'update dev version'
	git push

s3:
	aws s3 sync dist/prod s3://pudding.cool/2017/01/making-it-big

cloudfront:
	aws cloudfront create-invalidation --distribution-id E13X38CRR4E04D --paths '/2017/01/making-it-big*'  
