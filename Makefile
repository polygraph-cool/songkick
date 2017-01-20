# requires gac
live:
	rm -rf docs
	cp -r dist/prod/ docs
	gac 'update dev version'
	git push

s3:
	aws s3 sync dist/prod s3://pudding.cool/2017/01/making-it-big